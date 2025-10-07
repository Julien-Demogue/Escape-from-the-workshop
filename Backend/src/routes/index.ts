import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.route';
import partyRoutes from './party.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/parties', partyRoutes);

export default router;