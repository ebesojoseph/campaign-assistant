import { env } from '../config/env.js';
import { refreshCookieOptions } from '../config/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as auth from '../services/authService.js';

const meta = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });

function sendSession(res, s, status = 200) {
  res.cookie(env.cookie.name, s.refreshToken, { ...refreshCookieOptions(), expires: s.refreshExpiresAt });
  res.status(status).json({ data: { accessToken: s.accessToken, tokenType: 'Bearer', expiresIn: s.expiresIn, user: s.user } });
}

export const register = asyncHandler(async (req, res) => {
  const user = await auth.registerUser(req.validated.body, { bootstrap: Boolean(req.bootstrap) });
  res.status(201).json({ data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  sendSession(res, await auth.loginUser(req.validated.body, meta(req)));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    sendSession(res, await auth.refreshSession(req.cookies?.[env.cookie.name], meta(req)));
  } catch (err) {
    if (err instanceof AppError) res.clearCookie(env.cookie.name, refreshCookieOptions());
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await auth.revokeRefreshToken(req.cookies?.[env.cookie.name]);
  res.clearCookie(env.cookie.name, refreshCookieOptions());
  res.status(204).end();
});

export const logoutAll = asyncHandler(async (req, res) => {
  await auth.revokeAllForUser(req.user.id);
  res.clearCookie(env.cookie.name, refreshCookieOptions());
  res.status(204).end();
});

export const me = (req, res) => res.json({ data: { user: req.user } });
