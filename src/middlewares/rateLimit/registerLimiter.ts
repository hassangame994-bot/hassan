import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_REGISTER', 60 * 60 * 1000); // Default: 1 hour
const max = parseEnvInt('REGISTER_LIMIT', 5); // Default: 5 requests

export const registerLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد قمت بإنشاء العديد من الحسابات اليوم. يرجى المحاولة لاحقاً بعد ساعة.',
  errorMessageEn: 'Too many registrations from this client. Please try again in an hour.'
});
