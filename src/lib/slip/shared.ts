import { SlipDetails, SlipVerifyError } from './types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Providers are tried one after another, so a single hung request stalls the
 * whole chain — and the customer's top-up with it. Cutting a slow provider off
 * is also what lets the next one get its turn, which is the point of the chain.
 */
const TIMEOUT_MS = 15_000;

export const withTimeout = <T extends RequestInit>(init: T): T => ({
  ...init,
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

/**
 * Depth-first lookup, so a field keeps working whether it sits at the root or
 * nested under `data` / `data.rawSlip` / … Each provider wraps the bank's
 * response differently, so searching beats hard-coding a path per provider.
 */
export function findValue(source: unknown, keys: string[], depth = 0): unknown {
  if (!isRecord(source) || depth > 5) return undefined;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }

  for (const value of Object.values(source)) {
    const found = findValue(value, keys, depth + 1);
    if (found !== undefined) return found;
  }

  return undefined;
}

export function findString(source: unknown, keys: string[]): string | undefined {
  const value = findValue(source, keys);
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

/**
 * Like {@link findValue} but keeps digging until it finds an actual number.
 * EasySlip nests the figure as `amount: { amount: 50, local: {…} }`, so
 * stopping at the first key match would hand back an object.
 */
function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function findNumber(source: unknown, keys: string[], depth = 0): number | undefined {
  if (!isRecord(source) || depth > 5) return undefined;

  for (const key of keys) {
    const direct = toFiniteNumber(source[key]);
    if (direct !== undefined) return direct;

    const nested = findNumber(source[key], keys, depth + 1);
    if (nested !== undefined) return nested;
  }

  for (const value of Object.values(source)) {
    const found = findNumber(value, keys, depth + 1);
    if (found !== undefined) return found;
  }

  return undefined;
}

/**
 * ชื่อเจ้าของบัญชีจากฝั่ง sender/receiver
 *
 * Cannot go through {@link findString}: the bearer providers nest the name as
 * `account.name.{th,en}`, and a depth-first search for "name" reaches
 * `bank.name` first — which would file the bank's name as the customer's.
 */
function readPartyName(party: unknown): string | undefined {
  if (!isRecord(party)) return undefined;

  const account = isRecord(party.account) ? party.account : party;
  const name = account.name ?? account.displayName;

  if (typeof name === 'string' && name.trim()) return name.trim();

  if (isRecord(name)) {
    for (const key of ['th', 'en']) {
      const value = name[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return undefined;
}

/** ชื่อธนาคารของฝั่งนั้น — เจ้าที่บอกมาเป็น `sendingBank` ตรง ๆ จะใช้ค่านั้นก่อน */
function readBankName(party: unknown): string | undefined {
  if (!isRecord(party) || !isRecord(party.bank)) return undefined;

  const name = party.bank.name ?? party.bank.short;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

/** Collects every account-ish identifier under `receiver` so any of them can be matched. */
export function collectAccountIds(node: unknown, found: string[] = [], depth = 0): string[] {
  if (!isRecord(node) || depth > 4) return found;

  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && value.trim()) {
      if (/(account|value|proxy|no|number|id)$/i.test(key)) found.push(value.trim());
    } else if (isRecord(value)) {
      collectAccountIds(value, found, depth + 1);
    }
  }

  return found;
}

/** Banks report "20240101" + "12:51:57" far more often than a real timestamp. */
export function toIsoTimestamp(source: unknown): string | undefined {
  const direct = findString(source, ['transTimestamp', 'transactionDateTime', 'timestamp', 'date']);
  if (direct) {
    const parsed = new Date(direct);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const date = findString(source, ['transDate']);
  const time = findString(source, ['transTime']) ?? '00:00:00';

  if (date && /^\d{8}$/.test(date)) {
    const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time}+07:00`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return undefined;
}

/**
 * Turns any provider's success body into {@link SlipDetails}.
 *
 * `amountUnit` is per-provider because they do not agree: some report baht,
 * some satang. /api/topups cross-checks the result against the amount the
 * customer declared, so a wrong setting fails loudly rather than silently
 * crediting 100× the wrong figure.
 */
export function normalise(
  body: Record<string, unknown>,
  provider: string,
  amountUnit: string | undefined
): SlipDetails {
  const transRef = findString(body, ['transRef', 'transRefNo', 'transactionRef', 'ref']);
  const amount = findNumber(body, ['amount', 'paidLocalAmount', 'transAmount']);

  if (!transRef) {
    throw new SlipVerifyError(
      'slip_unreadable',
      'อ่านเลขอ้างอิงจากสลิปไม่ได้ กรุณาลองใหม่',
      400,
      // ตัวอ่าน QR/OCR ของแต่ละเจ้าไม่เท่ากันจริง ๆ ใบที่เจ้านี้อ่านไม่ออก
      // เจ้าถัดไปอาจอ่านออก จึงให้ลองต่อได้
      { retryable: true }
    );
  }

  if (amount === undefined || amount <= 0) {
    throw new SlipVerifyError(
      'slip_unreadable',
      'อ่านจำนวนเงินจากสลิปไม่ได้ กรุณาลองใหม่',
      400,
      { retryable: true }
    );
  }

  const receiver = findValue(body, ['receiver']);
  const sender = findValue(body, ['sender']);

  return {
    transRef,
    amount: amountUnit === 'satang' ? amount / 100 : amount,
    sendingBank: findString(body, ['sendingBank']) ?? readBankName(sender),
    receivingBank: findString(body, ['receivingBank']) ?? readBankName(receiver),
    senderName: readPartyName(sender) ?? findString(sender, ['displayName', 'name']),
    receiverName: readPartyName(receiver) ?? findString(receiver, ['displayName', 'name']),
    receiverAccounts: collectAccountIds(receiver),
    transferredAt: toIsoTimestamp(body),
    raw: body,
    provider,
  };
}

/**
 * Maps an HTTP status onto "is this the shop's problem or the slip's?".
 *
 * Anything that means *we* cannot ask right now — no credit, bad key, throttled,
 * provider down — is retryable so the next provider in the chain gets a turn.
 * 400/404 usually mean the provider read the slip and rejected it, which every
 * other provider would too.
 */
export function retryableStatus(status: number): boolean {
  if (status === 401 || status === 402 || status === 403 || status === 429) return true;
  return status >= 500;
}

/** Providers report their code as a string or a number; anything else is unusable. */
export function toErrorCode(value: unknown, fallback: number | string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return String(fallback);
}

/** Builds the rejection in one place so every provider words it the same way. */
export function failure(
  provider: string,
  code: string,
  message: string,
  retryable: boolean
): SlipVerifyError {
  return new SlipVerifyError(
    `${provider}_${code}`,
    retryable
      ? `ระบบตรวจสลิปใช้งานไม่ได้ (${code}: ${message})`
      : `สลิปไม่ถูกต้อง (${message})`,
    retryable ? 502 : 400,
    { retryable }
  );
}

/** Wraps a network-level failure — always worth trying the next provider. */
export function unreachable(provider: string): SlipVerifyError {
  return new SlipVerifyError(
    `${provider}_unreachable`,
    'ติดต่อระบบตรวจสลิปไม่ได้ กรุณาลองใหม่อีกครั้ง',
    502,
    { retryable: true }
  );
}
