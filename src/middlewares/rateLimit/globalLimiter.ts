import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_GLOBAL', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('GLOBAL_LIMIT', 1000); // Default: 1000 requests

export const globalLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'عذراً، لقد تجاوزت الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً.',
  errorMessageEn: 'Too many requests. Please try again later.'
});
