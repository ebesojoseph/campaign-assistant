import { env } from './env.js';

export const jwtConfig = Object.freeze({
  accessSecret: env.jwt.accessSecret,
  refreshSecret: env.jwt.refreshSecret,
  issuer: env.jwt.issuer,
  accessTtl: env.jwt.accessTtl,
  refreshTtlSeconds: env.jwt.refreshTtlDays * 24 * 60 * 60,
  algorithm: 'HS256',
});

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: env.cookie.path,
});
