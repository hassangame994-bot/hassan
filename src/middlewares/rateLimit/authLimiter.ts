import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_AUTH', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('RATE_LIMIT_MAX_AUTH', 100); // Default: 100 requests

export const authLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد قمت بإجراء الكثير من عمليات التحقق. يرجى الانتظار قليلاً.',
  errorMessageEn: 'Too many authentication attempts. Please try again later.'
});
