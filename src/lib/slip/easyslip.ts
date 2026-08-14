import { createBearerProvider } from './bearer';

/** EasySlip — https://document.easyslip.com */
export const easyslipProvider = createBearerProvider({
  name: 'easyslip',
  defaultBase: 'https://api.easyslip.com/v2',
  tokenEnv: 'EASYSLIP_TOKEN',
  baseUrlEnv: 'EASYSLIP_BASE_URL',
  amountUnitEnv: 'EASYSLIP_AMOUNT_UNIT',
  shopProblemCodes: new Set([
    'UNAUTHORIZED',
    'QUOTA_EXCEEDED',
    'APPLICATION_EXPIRED',
    'ACCOUNT_NOT_VERIFIED',
    'ACCESS_DENIED',
  ]),
});
