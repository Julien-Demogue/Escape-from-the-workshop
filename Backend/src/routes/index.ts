import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;