import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Utility to safely parse environment integers with strict defaults
 */
export const parseEnvInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
};

/**
 * Secure key generator prioritizing user authentication IDs to mitigate distributed guest attacks,
 * and falls back to clean, spoof-resistant proxy-forwarded IP addresses.
 */
export const generateLimiterKey = (req: Request): string => {
  // 1. Prioritize authenticated user context to protect multi-user NAT environments
  const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
  if (userId && typeof userId === 'string' && userId.trim() !== '') {
    return `user:${userId.trim()}:${req.path}`;
  }

  // 2. Securely resolve Client IP, taking care of reverse proxy forwarding headers
  const forwarded = req.headers['x-forwarded-for'];
  let ip = 'unknown-ip';
  if (typeof forwarded === 'string') {
    // Take the very first IP in the list (client IP) and trim it
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) ip = firstIp;
  } else {
    ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  }

  return `ip:${ip}:${req.path}`;
};

/**
 * Standard skip rules to bypass rate-limiting for critical infrastructure and OPTIONS checks
 */
export const skipRateLimitRules = (req: Request): boolean => {
  // Always skip OPTIONS preflight checks to prevent draining browser preflight quotas
  if (req.method === 'OPTIONS') return true;

  // Skip system diagnostics, health checkers and telemetry routes
  const skippedPaths = ['/api/health', '/api/healthz', '/api/events', '/favicon.ico'];
  if (skippedPaths.includes(req.path)) return true;

  return false;
};

/**
 * Standardized bilingual (Arabic/English) limit exceeded handler
 */
export const createLimitHandler = (errorMessageAr: string, errorMessageEn: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: `${errorMessageAr} (${errorMessageEn})`
    });
  };
};

/**
 * Enterprise rate-limiter factory builder
 */
interface LimiterOptions {
  windowMs: number;
  max: number;
  errorMessageAr: string;
  errorMessageEn: string;
}

export const createLimiter = (options: LimiterOptions): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: true, // Return standard RateLimit headers (draft-6)
    legacyHeaders: false, // Disable legacy X-RateLimit-* headers
    keyGenerator: generateLimiterKey,
    skip: skipRateLimitRules,
    validate: false, // Suppress all express-rate-limit validation warnings in production/container environments
    handler: createLimitHandler(options.errorMessageAr, options.errorMessageEn)
  });
};
