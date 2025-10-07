import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import partyRoutes from './party.routes';
import groupRoutes from './group.routes';
import infoRoutes from './info.routes';
import challengeRoutes from './challenge.routes';

const router = Router();

router.get('/', (req, res) => {
    res.send('Welcome to the Escape Game API');
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/parties', partyRoutes);
router.use('/groups', groupRoutes);
router.use('/info', infoRoutes);
router.use('/challenges', challengeRoutes);

export default router;