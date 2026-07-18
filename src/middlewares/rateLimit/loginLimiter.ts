import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_AUTH', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('LOGIN_LIMIT', 5); // Default: 5 attempts

export const loginLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'محاولات دخول كثيرة جداً. تم تعليق تسجيل الدخول مؤقتاً لحمايتك، يرجى المحاولة بعد 15 دقيقة.',
  errorMessageEn: 'Too many login attempts. Access is suspended for 15 minutes to protect your account.'
});
