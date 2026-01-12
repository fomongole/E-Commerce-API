import { Request, Response } from 'express';
import User from '../models/User';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk((req as any).user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk((req as any).user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { name, email } = req.body;
    await user.update({ name, email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};