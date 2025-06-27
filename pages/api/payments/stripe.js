import { authMiddleware } from '@/middleware/auth';
import { Order } from '@/models';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authMiddleware(['customer'])(req, res);
  if (!authResult?.user) return;

  try {
    const { orderId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // If orderId is provided, verify order exists and belongs to user
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.customerId !== authResult.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (order.paymentStatus === 'completed') {
        return res.status(400).json({ error: 'Order already paid' });
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata: {
        customerId: authResult.user.id.toString(),
        ...(orderId && { orderId: orderId.toString() })
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
}