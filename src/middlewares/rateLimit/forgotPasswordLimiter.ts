import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_FORGOT_PASSWORD', 60 * 60 * 1000); // Default: 1 hour
const max = parseEnvInt('FORGOT_PASSWORD_LIMIT', 3); // Default: 3 requests

export const forgotPasswordLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد تجاوزت الحد الأقصى لطلب استعادة كلمة المرور. يرجى المحاولة بعد ساعة.',
  errorMessageEn: 'Too many forgot password requests. Please try again in an hour.'
});
