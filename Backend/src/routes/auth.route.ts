import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with hashed email
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hashedEmail:
 *                 type: string
 *                 example: "hashed@example.com"
 *     responses:
 *       200:
 *         description: Returns a JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request (missing hashedEmail)
 *       401:
 *         description: Invalid hashed email
 *       500:
 *         description: Server error
 */
router.post('/login', (req: Request, res: Response) => authController.login(req, res));

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hashedEmail
 *               - username
 *               - color
 *             properties:
 *               hashedEmail:
 *                 type: string
 *                 example: "hashed@example.com"
 *               username:
 *                 type: string
 *                 example: "player1"
 *               color:
 *                 type: string
 *                 example: "#ffffff"
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 hashedEmail:
 *                   type: string
 *                 color:
 *                   type: string
 *       400:
 *         description: Bad request (missing hashedEmail or username)
 *       500:
 *         description: Server error
 */
router.post('/register', (req: Request, res: Response) => authController.register(req, res));

export default router;