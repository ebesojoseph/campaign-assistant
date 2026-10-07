import crypto from "node:crypto";
import { RefreshToken, sequelize } from "../models/index.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Op } = require("sequelize");
import { jwtConfig } from "../config/jwt.js";
import { ROLES } from "../constants/index.js";
import { AppError } from "../utils/AppError.js";
import {
  comparePassword,
  getDummyHash,
  hashPassword,
} from "../utils/password.js";
import {
  accessTtlSeconds,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { User } from "../models/index.js";

const invalidCredentials = () =>
  new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
const invalidRefresh = () =>
  new AppError(
    401,
    "Invalid or expired refresh token",
    "INVALID_REFRESH_TOKEN",
  );

async function issueTokens(user, meta = {}) {
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, jti);
  const expiresAt = new Date(Date.now() + jwtConfig.refreshTtlSeconds * 1000);

  await RefreshToken.create({
    id: jti,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: meta.userAgent?.slice(0, 255),
    ip: meta.ip?.slice(0, 64),
  });

  return {
    jti,
    accessToken: signAccessToken(user),
    expiresIn: accessTtlSeconds(),
    refreshToken,
    refreshExpiresAt: expiresAt,
  };
}
export async function registerUser(
  { name, email, password, role },
  { bootstrap = false } = {},
) {
  const existing = await User.findOne({ where: { email } });
  if (existing)
    throw new AppError(409, "Email already registered", "EMAIL_TAKEN");

  return User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: bootstrap ? ROLES.ADMIN : role || ROLES.MARKETER,
  }).then((u) => User.findByPk(u.id)); // re-read through the default scope (no hash)
}

export async function loginUser({ email, password }, meta) {
  const user = await User.scope("withPassword").findOne({ where: { email } });
  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const ok = await comparePassword(
    password,
    user?.passwordHash ?? (await getDummyHash()),
  );
  if (!user || !ok || !user.isActive) throw invalidCredentials();

  await user.update({ lastLoginAt: new Date() });
  const tokens = await issueTokens(user, meta);
  return { user: await User.findByPk(user.id), ...tokens };
}

/**
 * Refresh-token rotation with reuse detection:
 *  - every refresh token is single-use;
 *  - presenting an already-used token means it was likely stolen -> revoke the whole token family for that user.
 */
export async function refreshSession(token, meta) {
  if (!token) throw invalidRefresh();

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw invalidRefresh();
  }

  const record = await RefreshToken.findByPk(payload.jti);
  if (!record || record.userId !== payload.sub) throw invalidRefresh();

  if (record.revokedAt) {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId: record.userId, revokedAt: null } },
    );
    throw new AppError(
      401,
      "Refresh token reuse detected, please sign in again",
      "REFRESH_TOKEN_REUSED",
    );
  }
  if (record.tokenHash !== hashToken(token) || record.expiresAt < new Date())
    throw invalidRefresh();

  const user = await User.findByPk(record.userId);
  if (!user || !user.isActive) throw invalidRefresh();

  // Atomic claim: only one concurrent request can win the rotation.
  const [claimed] = await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { id: record.id, revokedAt: null } },
  );
  if (!claimed) throw invalidRefresh();

  const tokens = await issueTokens(user, meta);
  await RefreshToken.update(
    { replacedBy: tokens.jti },
    { where: { id: record.id } },
  );
  return { user, ...tokens };
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  try {
    const { jti } = verifyRefreshToken(token);
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { id: jti, revokedAt: null } },
    );
  } catch {
    /* already invalid -> nothing to revoke */
  }
}

export const revokeAllForUser = (userId) =>
  RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );

/** Housekeeping: delete tokens that expired more than a day ago. */
export const purgeExpiredTokens = () =>
  RefreshToken.destroy({
    where: { expiresAt: { [Op.lt]: new Date(Date.now() - 24 * 3600 * 1000) } },
  });

export { sequelize };
