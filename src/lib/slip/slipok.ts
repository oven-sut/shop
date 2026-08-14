import { failure, isRecord, normalise, retryableStatus, toErrorCode, unreachable } from './shared';
import { SlipDetails, SlipInput, SlipProvider } from './types';

/** SlipOK — https://slipok.com/api-documentation/check-slip/ */
const DEFAULT_BASE = 'https://api.slipok.com/api/line/apikey';

/**
 * โควตาหมด / คีย์ผิด / สาขาถูกปิด — ปัญหาฝั่งร้าน
 *
 * SlipOK ไม่ได้ประกาศตารางรหัสไว้ครบในเอกสาร จึงจับเท่าที่ยืนยันได้
 * ส่วนรหัสที่ไม่รู้จักจะตกไปใช้การเดาจาก HTTP status ด้านล่างแทน
 */
const SHOP_PROBLEM_CODES = new Set(['1000', '1001', '1002', '1003', '1004']);

export const slipokProvider: SlipProvider = {
  name: 'slipok',

  isConfigured() {
    return Boolean(process.env.SLIPOK_API_KEY && process.env.SLIPOK_BRANCH_ID);
  },

  async verify(input: SlipInput): Promise<SlipDetails> {
    const base = process.env.SLIPOK_BASE_URL || DEFAULT_BASE;
    const url = `${base.replace(/\/$/, '')}/${process.env.SLIPOK_BRANCH_ID}`;
    const apiKey = process.env.SLIPOK_API_KEY as string;

    let request: RequestInit;
    if ('payload' in input) {
      request = {
        method: 'POST',
        headers: { 'x-authorization': apiKey, 'Content-Type': 'application/json' },
        // log=true ให้ SlipOK ยืนยันกับธนาคารและเช็คสลิปซ้ำให้ด้วย
        body: JSON.stringify({ data: input.payload, log: true }),
      };
    } else {
      const form = new FormData();
      form.append('files', input.file);
      form.append('log', 'true');
      request = { method: 'POST', headers: { 'x-authorization': apiKey }, body: form };
    }

    let response: Response;
    try {
      response = await fetch(url, request);
    } catch {
      throw unreachable('slipok');
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !isRecord(body) || body.success === false) {
      const code = toErrorCode(isRecord(body) ? body.code : undefined, response.status);
      const message =
        isRecord(body) && typeof body.message === 'string' ? body.message : 'ตรวจสอบสลิปไม่สำเร็จ';

      throw failure(
        'slipok',
        code,
        message,
        SHOP_PROBLEM_CODES.has(code) || retryableStatus(response.status)
      );
    }

    // ผลจริงอยู่ใน data — normalise ค้นลงไปเองได้ แต่ส่งชั้นในให้ตรง ๆ ชัดกว่า
    const data = isRecord(body.data) ? body.data : body;

    return normalise(data, 'slipok', process.env.SLIPOK_AMOUNT_UNIT);
  },
};
