import {
  failure,
  isRecord,
  normalise,
  retryableStatus,
  toErrorCode,
  unreachable,
  withTimeout,
} from './shared';
import { SlipDetails, SlipInput, SlipProvider, SlipVerifyError } from './types';

/** RDCW Slip Verify — https://slip.rdcw.co.th/docs */
const DEFAULT_URL = 'https://suba.rdcw.co.th/v2/inquiry';

/** โควตาหมด / แพ็กเกจหมดอายุ / คีย์ผิด — ปัญหาฝั่งร้าน ไม่ใช่สลิปของลูกค้า */
const SHOP_PROBLEM_CODES = new Set(['1000', '1001', '1002', '1003', '1007', '1008']);

export const rdcwProvider: SlipProvider = {
  name: 'rdcw',

  isConfigured() {
    return Boolean(process.env.RDCW_CLIENT_ID && process.env.RDCW_CLIENT_SECRET);
  },

  async verify(input: SlipInput): Promise<SlipDetails> {
    const authorization = `Basic ${Buffer.from(
      `${process.env.RDCW_CLIENT_ID}:${process.env.RDCW_CLIENT_SECRET}`
    ).toString('base64')}`;

    let request: RequestInit;
    if ('payload' in input) {
      request = {
        method: 'POST',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: input.payload }),
      };
    } else {
      const form = new FormData();
      form.append('file', input.file);
      // Content-Type is left off on purpose: fetch adds the multipart boundary.
      request = { method: 'POST', headers: { Authorization: authorization }, body: form };
    }

    let response: Response;
    try {
      response = await fetch(process.env.RDCW_BASE_URL || DEFAULT_URL, withTimeout(request));
    } catch {
      throw unreachable('rdcw');
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !isRecord(body)) {
      const code = toErrorCode(isRecord(body) ? body.code : undefined, response.status);
      const message =
        isRecord(body) && typeof body.message === 'string' ? body.message : 'ตรวจสอบสลิปไม่สำเร็จ';

      throw failure(
        'rdcw',
        code,
        message,
        SHOP_PROBLEM_CODES.has(code) || retryableStatus(response.status)
      );
    }

    if (body.valid === false) {
      // ธนาคารตอบแล้วว่าไม่ยืนยัน — เจ้าอื่นก็จะได้คำตอบเดียวกัน
      throw new SlipVerifyError('slip_invalid', 'ธนาคารไม่ยืนยันสลิปนี้ กรุณาตรวจสอบอีกครั้ง');
    }

    return normalise(body, 'rdcw', process.env.RDCW_AMOUNT_UNIT);
  },
};
