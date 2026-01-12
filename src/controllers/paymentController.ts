import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-12-15.clover',
});

// @desc    Create Payment Intent (Prepare to charge)
// @route   POST /api/payments/create-intent
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;

    // 1. Find the Order
    const order = await Order.findByPk(orderId);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status === 'paid') {
      res.status(400).json({ message: 'Order already paid' });
      return;
    }

    // 2. Create Payment Intent with Stripe
    // Stripe expects amounts in CENTS (e.g., $10.00 = 1000 cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), 
      currency: 'usd',
      metadata: { orderId: order.id.toString() }, // Keep track of which order this is
    });

    // 3. Send the "Client Secret" to the frontend
    // The frontend would use this key to confirm the payment securely
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    res.status(500).json({ message: 'Stripe Error', error });
  }
};

// @desc    Simulate Webhook (Mark order as paid)
// @route   POST /api/payments/webhook-simulation
export const simulateWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    // 1. Verifying with Stripe that this payment is actually successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
        // 2. Update Order Status in Database
        // We read the orderId we saved in 'metadata' earlier
        const orderId = paymentIntent.metadata.orderId;
        
        await Order.update({ status: 'paid' }, { where: { id: orderId } });

        res.json({ message: 'Order status updated to PAID' });
    } else {
        res.status(400).json({ message: 'Payment not successful yet', status: paymentIntent.status });
    }

  } catch (error) {
    res.status(500).json({ message: 'Webhook Error', error });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      await Order.update({ status: 'paid' }, { where: { id: orderId } });
    } else if (event.type === 'payment_intent.payment_failed') {
      //logging only for now
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed for PaymentIntent ID: ${paymentIntent.id}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ message: 'Webhook Error', error: error.message });
  }
};