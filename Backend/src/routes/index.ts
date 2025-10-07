import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.route';
import partyRoutes from './party.routes';
import groupRoutes from './group.routes';

const router = Router();

router.get('/', (req, res) => {
    res.send('Welcome to the Escape Game API');
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/parties', partyRoutes);
router.use('/groups', groupRoutes);

export default router;