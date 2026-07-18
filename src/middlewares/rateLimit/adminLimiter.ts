import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_ADMIN', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('ADMIN_LIMIT', 200); // Default: 200 requests

export const adminLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'غير مصرح: تم حظر طلبات الإدارة لتجاوزها السعة المحددة.',
  errorMessageEn: 'Forbidden: Admin command limit reached.'
});
