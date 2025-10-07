import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();

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
router.post('/login', async (req: Request, res: Response) => {
    try {
        const hashedEmail = req.body.hashedEmail;
        if (!hashedEmail) {
            return res.status(400).json({ error: 'Hashed email is required' });
        }

        const user = await userService.getByEmail(hashedEmail);
        if (!user) {
            return res.status(401).json({ error: 'Invalid hashed email' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }

        const token = jwt.sign({
            id: user.id, hashedEmail: user.hashedEmail
        },
            secret,
            { expiresIn: '24h' }
        )

        return res.status(200).json({ token });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
router.post('/register', (req: Request, res: Response) => {
    try {
        const { hashedEmail, username, color } = req.body;
        if (!hashedEmail || !username || !color) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const newUser = userService.createUser(hashedEmail, username, color);
        return res.status(201).json(newUser);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;