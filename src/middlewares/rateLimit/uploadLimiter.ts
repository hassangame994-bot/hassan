import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_UPLOAD', 60 * 60 * 1000); // Default: 1 hour
const max = parseEnvInt('UPLOAD_LIMIT', 10); // Default: 10 uploads

export const uploadLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد تجاوزت الحد المسموح به لرفع الملفات والصور. يرجى المحاولة بعد ساعة.',
  errorMessageEn: 'Too many file upload requests. Please try again in an hour.'
});
