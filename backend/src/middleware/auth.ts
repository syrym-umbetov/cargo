import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

interface AuthRequest extends Request {
  userId?: number;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Simple token format: simple-token-{userId}-{timestamp}
  if (token.startsWith('simple-token-')) {
    const parts = token.split('-');
    if (parts.length === 4) {
      const userId = parseInt(parts[2]);

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        req.userId = userId;
        return next();
      }
    }
  }

  return res.status(403).json({ error: 'Invalid token' });
};