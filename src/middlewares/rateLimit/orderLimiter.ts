import { createLimiter, parseEnvInt } from './createLimiter.js';

// Order creation thresholds: 20 requests per 10 minutes
const orderWindowMs = parseEnvInt('RATE_LIMIT_WINDOW_ORDER', 10 * 60 * 1000); // 10 minutes
const orderMax = parseEnvInt('ORDER_LIMIT', 20);

export const orderLimiter = createLimiter({
  windowMs: orderWindowMs,
  max: orderMax,
  errorMessageAr: 'عذراً، لقد تجاوزت الحد الأقصى لإنشاء الطلبات لسلامة الخدمة والمطبخ.',
  errorMessageEn: 'Too many orders created. Please wait before submitting more orders.'
});

// Order tracking thresholds: 120 requests per 15 minutes
const trackWindowMs = parseEnvInt('RATE_LIMIT_WINDOW_TRACK_ORDER', 15 * 60 * 1000); // 15 minutes
const trackMax = parseEnvInt('TRACK_ORDER_LIMIT', 120);

export const trackOrderLimiter = createLimiter({
  windowMs: trackWindowMs,
  max: trackMax,
  errorMessageAr: 'لقد قمت بمحاولة تتبع طلباتك عدة مرات، يرجى الانتظار قليلاً.',
  errorMessageEn: 'Too many order tracking requests. Please try again in a few minutes.'
});
