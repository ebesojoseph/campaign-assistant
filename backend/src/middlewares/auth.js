import { User } from '../models/index.js';
import { ROLES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    throw new AppError(401, expired ? 'Access token expired' : 'Invalid access token', expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN');
  }

  // Load the user on every request so deactivation / role changes take effect immediately.
  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw new AppError(401, 'Account not found or disabled', 'UNAUTHENTICATED');

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));

/**
 * Registration policy for an internal tool: the very first account bootstraps the system as admin,
 * after that only admins can create accounts.
 */
export const bootstrapOrAdmin = asyncHandler(async (req, res, next) => {
  if ((await User.count()) === 0) {
    req.bootstrap = true;
    return next();
  }
  return authenticate(req, res, (err) => {
    if (err) return next(err);
    return authorize(ROLES.ADMIN)(req, res, next);
  });
});
