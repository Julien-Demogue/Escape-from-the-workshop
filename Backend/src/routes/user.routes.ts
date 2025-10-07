import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.get('/:id', (req, res) => userController.getUserById(req, res));

export default router;