import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { error: { code: 'RATE_LIMITED', message } },
  });

export const apiLimiter = make(60_000, 120, 'Too many requests, slow down');
export const authLimiter = make(15 * 60_000, 20, 'Too many authentication attempts, try again later');
export const aiLimiter = make(60_000, 10, 'AI generation rate limit reached, try again shortly');
