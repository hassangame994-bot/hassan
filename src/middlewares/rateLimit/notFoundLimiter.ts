import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_NOT_FOUND', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('NOT_FOUND_LIMIT', 30); // Default: 30 requests for 404 routes

export const notFoundLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد قمت بطلب العديد من الصفحات غير الموجودة، تم تقييد وصولك مؤقتاً.',
  errorMessageEn: 'Too many requests for unknown endpoints. Access is temporarily suspended.'
});
