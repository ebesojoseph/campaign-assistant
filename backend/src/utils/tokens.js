import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

const verifyOpts = { algorithms: [jwtConfig.algorithm], issuer: jwtConfig.issuer };

export const signAccessToken = (user) =>
  jwt.sign({ role: user.role }, jwtConfig.accessSecret, {
    subject: user.id,
    issuer: jwtConfig.issuer,
    expiresIn: jwtConfig.accessTtl,
    algorithm: jwtConfig.algorithm,
  });

export const verifyAccessToken = (token) => jwt.verify(token, jwtConfig.accessSecret, verifyOpts);

export const signRefreshToken = (userId, jti) =>
  jwt.sign({}, jwtConfig.refreshSecret, {
    subject: userId,
    jwtid: jti,
    issuer: jwtConfig.issuer,
    expiresIn: jwtConfig.refreshTtlSeconds,
    algorithm: jwtConfig.algorithm,
  });

export const verifyRefreshToken = (token) => jwt.verify(token, jwtConfig.refreshSecret, verifyOpts);

/** Refresh tokens are stored hashed so a DB leak cannot be replayed. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Seconds until the access token expires (for the client). */
export const accessTtlSeconds = () => {
  const m = String(jwtConfig.accessTtl).match(/^(\d+)([smhd])?$/);
  if (!m) return 900;
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[m[2] || 's'];
  return Number(m[1]) * mult;
};
