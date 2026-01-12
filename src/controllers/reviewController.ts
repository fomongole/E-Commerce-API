import { Request, Response } from 'express';
import Review from '../models/Review';
import redisClient from '../config/redis';

export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      userId: (req as any).user.id,
      productId: req.params.id,
      rating,
      comment,
    });
    await redisClient.del('products'); // Invalidate to update averages
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getReviewsForProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.id },
      include: ['User'], // Assuming you want user names; adjust
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};