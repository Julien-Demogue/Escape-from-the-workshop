import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

export class AuthController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const hashedEmail = req.body.hashedEmail;
            if (!hashedEmail) {
                res.status(400).json({ error: 'Hashed email is required' });
                return;
            }

            const user = await this.userService.getByEmail(hashedEmail);
            if (!user) {
                res.status(401).json({ error: 'Invalid hashed email' });
                return;
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500).json({ error: 'JWT secret not configured' });
                return;
            }

            const token = jwt.sign({ id: user.id, hashedEmail: user.hashedEmail }, secret, { expiresIn: '24h' });
            res.status(200).json({ token });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { hashedEmail, username, color } = req.body;
            if (!hashedEmail || !username || !color) {
                res.status(400).json({ error: 'Invalid parameters' });
                return;
            }

            const newUser = await this.userService.createUser(hashedEmail, username, color);
            res.status(201).json(newUser);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
