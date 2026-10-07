import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const notFound = (req, res, next) =>
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));

function normalize(err) {
  if (err instanceof AppError) return err;

  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      return new AppError(409, 'Resource already exists', 'CONFLICT', err.errors?.map((e) => ({ field: e.path, message: 'must be unique' })));
    case 'SequelizeValidationError':
      return new AppError(422, 'Validation failed', 'VALIDATION_ERROR', err.errors?.map((e) => ({ field: e.path, message: e.message })));
    case 'SequelizeForeignKeyConstraintError':
      return new AppError(409, 'Operation conflicts with related resources', 'CONFLICT');
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      return new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    default:
  }
  if (err.type === 'entity.parse.failed') return new AppError(400, 'Malformed JSON body', 'BAD_REQUEST');
  if (err.type === 'entity.too.large') return new AppError(413, 'Payload too large', 'PAYLOAD_TOO_LARGE');
  if (err.message === 'CORS_NOT_ALLOWED') return new AppError(403, 'Origin not allowed', 'CORS_NOT_ALLOWED');
  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = normalize(err);
  if (!known) {
    if (!env.isTest) console.error('[unhandled error]', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', ...(env.isProd ? {} : { stack: err.stack }) },
    });
  }
  return res.status(known.statusCode).json({
    error: { code: known.code, message: known.message, ...(known.details ? { details: known.details } : {}) },
  });
}
