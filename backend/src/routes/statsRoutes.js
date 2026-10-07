import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', statsController.getStats);

export default router;
