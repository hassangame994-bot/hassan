import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_REVIEW', 60 * 60 * 1000); // Default: 1 hour
const max = parseEnvInt('REVIEW_LIMIT', 5); // Default: 5 reviews

export const reviewLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد تجاوزت الحد المسموح به لكتابة التقييمات. يرجى المحاولة بعد ساعة.',
  errorMessageEn: 'Too many review submissions. Please try again in an hour.'
});
