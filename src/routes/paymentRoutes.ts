import { Router } from 'express';
import { createPaymentIntent, simulateWebhook, handleWebhook } from '../controllers/paymentController';
import { protect } from '../middlewares/authMiddleware';
import express from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Stripe payment processing
 */

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Initialize Stripe Payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Returns clientSecret and paymentIntentId
 *       400:
 *         description: Order already paid
 */
router.post('/create-intent', protect, createPaymentIntent);

/**
 * @swagger
 * /api/payments/webhook-test:
 *   post:
 *     summary: Simulate Stripe Webhook (Dev Only)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order marked as paid
 */
router.post('/webhook-test', simulateWebhook);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe Webhook (Production)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Event received
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;