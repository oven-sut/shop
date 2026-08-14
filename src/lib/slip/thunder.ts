import { createBearerProvider } from './bearer';

/** Thunder Solution — https://document.thunder.in.th/th/v2/ */
export const thunderProvider = createBearerProvider({
  name: 'thunder',
  defaultBase: 'https://api.thunder.in.th/v2',
  tokenEnv: 'THUNDER_API_KEY',
  baseUrlEnv: 'THUNDER_BASE_URL',
  amountUnitEnv: 'THUNDER_AMOUNT_UNIT',
  // จากตารางรหัสในเอกสาร — ที่เหลือ (SLIP_NOT_FOUND, VALIDATION_ERROR)
  // แปลว่าสลิปใบนั้นใช้ไม่ได้จริง จึงไม่ต้องไล่ถามเจ้าอื่นต่อ
  shopProblemCodes: new Set([
    'MISSING_API_KEY',
    'INVALID_API_KEY',
    'BRANCH_INACTIVE',
    'SERVICE_BANNED',
    'USER_BANNED',
    'IP_NOT_ALLOWED',
    'QUOTA_EXCEEDED',
    'API_SERVER_ERROR',
  ]),
});
