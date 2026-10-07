import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';

export const securityHeaders = helmet();

export const corsMiddleware = cors({
  credentials: true, // required so the browser sends the HttpOnly refresh cookie
  origin(origin, cb) {
    if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS_NOT_ALLOWED'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
});
