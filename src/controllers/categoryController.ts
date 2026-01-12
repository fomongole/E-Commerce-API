import { Request, Response } from 'express';
import Category from '../models/Category';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.findAll();
  res.json(categories);
};