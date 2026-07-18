import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_RESERVATION', 60 * 60 * 1000); // Default: 1 hour
const max = parseEnvInt('RESERVATION_LIMIT', 10); // Default: 10 requests

export const reservationLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد تجاوزت الحد المسموح به لعمل الحجوزات. يرجى المحاولة بعد ساعة.',
  errorMessageEn: 'Too many reservation requests. Please try again in an hour.'
});
