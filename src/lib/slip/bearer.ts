import { failure, isRecord, normalise, retryableStatus, toErrorCode, unreachable } from './shared';
import { SlipDetails, SlipInput, SlipProvider } from './types';

/**
 * EasySlip และ Thunder ใช้สัญญา API หน้าตาเดียวกันเป๊ะ:
 * `Authorization: Bearer <token>` ยิง POST ไป `/verify/bank`
 * ตอบกลับเป็น `{ success, data }` หรือ `{ success:false, error:{ code, message } }`
 *
 * จึงเขียนตัวเดียวแล้วประกอบร่างสองเจ้าจากค่าคอนฟิก ไม่ต้องคัดลอกโค้ดซ้ำ
 */
export interface BearerProviderConfig {
  name: string;
  defaultBase: string;
  /** ชื่อ env ของโทเคน เช่น EASYSLIP_TOKEN */
  tokenEnv: string;
  baseUrlEnv: string;
  amountUnitEnv: string;
  /** รหัสที่แปลว่าร้านใช้บริการต่อไม่ได้ (ต่างจากสลิปใบนี้ใช้ไม่ได้) */
  shopProblemCodes: Set<string>;
}

/** รหัสที่ไม่รู้จัก ตัดสินจากคำเหล่านี้แทน */
const SHOP_PROBLEM_PATTERNS = [
  'quota',
  'limit',
  'expired',
  'unauthorized',
  'api_key',
  'apikey',
  'token',
  'banned',
  'inactive',
  'not_allowed',
  'access_denied',
  'not_verified',
];

function isShopProblem(code: string, status: number, codes: Set<string>): boolean {
  if (retryableStatus(status)) return true;
  if (codes.has(code.toUpperCase())) return true;

  const lowered = code.toLowerCase();
  return SHOP_PROBLEM_PATTERNS.some((pattern) => lowered.includes(pattern));
}

export function createBearerProvider(config: BearerProviderConfig): SlipProvider {
  return {
    name: config.name,

    isConfigured() {
      return Boolean(process.env[config.tokenEnv]);
    },

    async verify(input: SlipInput): Promise<SlipDetails> {
      const base = (process.env[config.baseUrlEnv] || config.defaultBase).replace(/\/$/, '');
      const authorization = `Bearer ${process.env[config.tokenEnv]}`;

      let url: string;
      let request: RequestInit;

      if ('payload' in input) {
        url = `${base}/verify/bank`;
        request = {
          method: 'POST',
          headers: { Authorization: authorization, 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: input.payload }),
        };
      } else {
        url = `${base}/verify/bank/image`;
        const form = new FormData();
        form.append('file', input.file);
        // Content-Type ปล่อยว่างไว้ ให้ fetch ใส่ multipart boundary เอง
        request = { method: 'POST', headers: { Authorization: authorization }, body: form };
      }

      let response: Response;
      try {
        response = await fetch(url, request);
      } catch {
        throw unreachable(config.name);
      }

      const body: unknown = await response.json().catch(() => null);
      const failed = !response.ok || !isRecord(body) || body.success === false;

      if (failed) {
        const error = isRecord(body) && isRecord(body.error) ? body.error : {};
        const code = toErrorCode(error.code, response.status);
        const message = typeof error.message === 'string' ? error.message : code;

        throw failure(
          config.name,
          code,
          message,
          isShopProblem(code, response.status, config.shopProblemCodes)
        );
      }

      const data = isRecord(body) && isRecord(body.data) ? body.data : (body as Record<string, unknown>);

      return normalise(data, config.name, process.env[config.amountUnitEnv]);
    },
  };
}
