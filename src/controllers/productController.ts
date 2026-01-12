import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import Review from '../models/Review';
import redisClient from '../config/redis';
import sequelize from '../config/database';
import { Op, Order } from 'sequelize';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, categoryId, sort = 'name:asc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (categoryId) where.categoryId = Number(categoryId);

    const order: Order = sort 
      ? [[(sort as string).split(':')[0], (sort as string).split(':')[1].toUpperCase()]] 
      : [['name', 'ASC']];

    const cacheKey = `products:${JSON.stringify({ ...req.query })}`;

    const cachedProducts = await redisClient.get(cacheKey);
    if (cachedProducts) {
      res.setHeader('X-Cache', 'HIT');
      res.json(JSON.parse(cachedProducts));
      return;
    }

    const { rows: products, count } = await Product.findAndCountAll({
      where,
      // Using attributes: [] because we only want the aggregated AVG, not the list of reviews.
      include: [
        Category,
        { model: Review, attributes: [] } 
      ],
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('Reviews.rating')), 'averageRating']
        ]
      },
      group: ['Product.id', 'Category.id'], 
      subQuery: false,
      offset,
      limit: Number(limit),
      order,
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    await redisClient.setEx(cacheKey, 300, JSON.stringify({ 
      data: products, 
      total: totalCount, 
      pages: Math.ceil(totalCount / Number(limit))
    }));

    res.setHeader('X-Cache', 'MISS');
    res.json({ 
      data: products, 
      total: totalCount, 
      pages: Math.ceil(totalCount / Number(limit))
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByPk(Number(req.params.id), {
      include: [
        Category,
        { model: Review, attributes: [] }
      ],
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('Reviews.rating')), 'averageRating']
        ]
      },
      group: ['Product.id', 'Category.id'],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await Product.create({ name, description, price, stock, categoryId, imageUrl });
    await redisClient.del('products'); 
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByPk(Number(req.params.id));
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    const { name, description, price, stock, categoryId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : product.imageUrl;

    await product.update({ name, description, price, stock, categoryId, imageUrl });
    await redisClient.del('products');
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByPk(Number(req.params.id));
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    await product.destroy();
    await redisClient.del('products');
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};