import { Router } from 'express';
import authRoutes from './authRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import customerRoutes from './customerRoutes.js';
import segmentRoutes from './segmentRoutes.js';
import statsRouter from './statsRoutes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/segments', segmentRoutes);
router.use('/campaigns', campaignRoutes);
router.use("/stats", statsRouter)
export default router;
