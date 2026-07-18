import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_PROFILE', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('PROFILE_LIMIT', 60); // Default: 60 requests

export const profileLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد قمت بتحديث بيانات ملفك الشخصي عدة مرات، يرجى الانتظار قليلاً.',
  errorMessageEn: 'Too many profile updates. Please try again in a few minutes.'
});
