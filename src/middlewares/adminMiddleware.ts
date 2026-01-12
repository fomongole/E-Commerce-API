import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await User.findByPk((req as any).user.id);
  if (user && user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};