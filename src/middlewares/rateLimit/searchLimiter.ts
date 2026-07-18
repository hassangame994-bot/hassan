import { createLimiter, parseEnvInt } from './createLimiter.js';

const windowMs = parseEnvInt('RATE_LIMIT_WINDOW_SEARCH', 60 * 1000); // Default: 1 minute
const max = parseEnvInt('SEARCH_LIMIT', 60); // Default: 60 requests

export const searchLimiter = createLimiter({
  windowMs,
  max,
  errorMessageAr: 'لقد قمت بإجراء الكثير من عمليات البحث. يرجى الانتظار قليلاً.',
  errorMessageEn: 'Too many search requests. Please wait a minute.'
});
