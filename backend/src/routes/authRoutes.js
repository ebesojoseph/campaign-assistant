import { Router } from 'express';
import { ROLES, enumValues } from '../constants/index.js';
import * as ctrl from '../controllers/authController.js';
import { authenticate, bootstrapOrAdmin } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';

const strongPassword = (v) =>
  /[A-Za-z]/.test(v) && /\d/.test(v) ? null : 'must contain at least one letter and one digit';

const registerSchema = {
  name: { type: 'string', required: true, maxLength: 120 },
  email: { type: 'string', required: true, email: true, maxLength: 255, lowercase: true },
  // bcrypt only uses the first 72 bytes, so cap the length instead of silently truncating
  password: { type: 'string', required: true, minLength: 10, maxLength: 72, custom: strongPassword },
  role: { type: 'string', enum: enumValues(ROLES) },
};

const loginSchema = {
  email: { type: 'string', required: true, email: true, lowercase: true },
  password: { type: 'string', required: true, maxLength: 72 },
};

const router = Router();
router.post('/register', authLimiter, bootstrapOrAdmin, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/logout-all', authenticate, ctrl.logoutAll);
router.get('/me', authenticate, ctrl.me);
export default router;
