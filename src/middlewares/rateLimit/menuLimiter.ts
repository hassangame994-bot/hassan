import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_MENU', 15 * 60 * 1000); // Default: 15 minutes
const max = parseEnvInt('MENU_LIMIT', 1000); // Default: 1000 requests

export const menuLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'تم تجاوز حد تصفح المنيو المسموح به. يرجى التصفح بهدوء.',
  errorMessageEn: 'Too many menu requests. Please browse naturally.'
});
