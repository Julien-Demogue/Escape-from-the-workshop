import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token missing' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }

        const payload = jwt.verify(token, secret);
        (req as any).user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}