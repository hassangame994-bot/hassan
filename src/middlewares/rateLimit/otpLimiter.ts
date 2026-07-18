import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_OTP', 10 * 60 * 1000); // Default: 10 minutes
const max = parseEnvInt('OTP_LIMIT', 5); // Default: 5 requests

export const otpLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد تجاوزت الحد الأقصى لطلب أو التحقق من رمز التحقق (OTP). يرجى المحاولة بعد 10 دقائق.',
  errorMessageEn: 'Too many OTP requests or verification attempts. Please try again in 10 minutes.'
});
