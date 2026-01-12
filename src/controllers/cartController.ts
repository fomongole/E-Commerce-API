import { Request, Response } from 'express';
import Cart from '../models/Cart';
import CartItem from '../models/CartItem';
import Product from '../models/Product';
import sequelize from '../config/database';

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    let cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [Product],
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const userId = (req as any).user.id;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ where: { userId }, transaction: t });
    if (!cart) {
      cart = await Cart.create({ userId }, { transaction: t });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      throw new Error('Product not found');
    }

    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
      transaction: t,
    });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save({ transaction: t });
    } else {
      await CartItem.create(
        {
          cartId: cart.id,
          productId,
          quantity: quantity || 1,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ message: 'Item added to cart' });
  } catch (error: any) {
    await t.rollback();
    res.status(400).json({ message: error.message || 'Failed to add to cart' });
  }
};

export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (!cartItem) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    await cartItem.destroy();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const clearCart = async (userId: number): Promise<void> => {
  const cart = await Cart.findOne({ where: { userId } });
  if (cart) {
    await CartItem.destroy({ where: { cartId: cart.id } });
  }
};