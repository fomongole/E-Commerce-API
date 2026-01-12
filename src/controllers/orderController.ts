import { Request, Response } from 'express';
import sequelize from '../config/database';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import User from '../models/User';
import { clearCart } from './cartController';
import Cart from '../models/Cart';
import CartItem from '../models/CartItem';
import redisClient from '../config/redis';

// what the frontend sends us
interface OrderItemInput {
  productId: number;
  quantity: number;
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const userId = (req as any).user.id;
    let items: OrderItemInput[] = req.body.items || [];

    // If no items provided, pull from cart
    if (items.length === 0) {
      const cart = await Cart.findOne({
        where: { userId },
        include: [CartItem],
        transaction: t,
      }) as Cart & { CartItems: CartItem[] }; 

      if (!cart || cart.CartItems.length === 0) {
        throw new Error('Cart is empty');
      }
      items = cart.CartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }

    let totalAmount = 0;

    const order = await Order.create(
      { userId, total: 0, status: 'pending' },
      { transaction: t }
    );

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        throw new Error(`Product ID ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
      product.stock -= item.quantity;
      await product.save({ transaction: t });

      await OrderItem.create(
        {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction: t }
      );

      totalAmount += Number(product.price) * item.quantity;
    }

    order.total = totalAmount;
    await order.save({ transaction: t });

    // Clear cart after successful order
    await clearCart(userId);

    await t.commit();
    await redisClient.del('products'); 
    res.status(201).json({ message: 'Order created', orderId: order.id, total: totalAmount });
  } catch (error: any) {
    await t.rollback();
    res.status(400).json({ message: error.message || 'Order failed' });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { userId };
    if (status) where.status = status;

    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit),
    });
    res.json({ data: orders, total: count, pages: Math.ceil(count / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findByPk(Number(req.params.id), {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    const user = await User.findByPk((req as any).user.id);
    
    if (order.userId !== (req as any).user.id && user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = Number(userId);

    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit),
    });
    res.json({ data: orders, total: count, pages: Math.ceil(count / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findByPk(Number(req.params.id));
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    const { status } = req.body;
    if (!['pending', 'paid', 'shipped', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }
    await order.update({ status });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};