import { Order } from '@/models';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature (uncomment when you set up webhook endpoint in Stripe)
    // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // For now, handle the payload directly (for testing)
    event = req.body;

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Update order payment status
          const order = await Order.findByPk(orderId);
          if (order) {
            order.paymentStatus = 'completed';
            order.paymentVerified = true;
            order.paymentVerifiedAt = new Date();
            
            // Add payment to history
            const paymentHistory = order.paymentHistory || [];
            paymentHistory.push({
              amount: paymentIntent.amount / 100, // Convert from cents
              method: 'stripe',
              transactionId: paymentIntent.id,
              status: 'completed',
              timestamp: new Date(),
              currency: paymentIntent.currency
            });
            order.paymentHistory = paymentHistory;
            
            await order.save();
            
            console.log(`Payment confirmed for order ${orderId}`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedOrderId = failedPayment.metadata.orderId;
        
        if (failedOrderId) {
          const order = await Order.findByPk(failedOrderId);
          if (order) {
            order.paymentStatus = 'failed';
            
            const paymentHistory = order.paymentHistory || [];
            paymentHistory.push({
              amount: failedPayment.amount / 100,
              method: 'stripe',
              transactionId: failedPayment.id,
              status: 'failed',
              timestamp: new Date(),
              currency: failedPayment.currency,
              error: failedPayment.last_payment_error?.message
            });
            order.paymentHistory = paymentHistory;
            
            await order.save();
            
            console.log(`Payment failed for order ${failedOrderId}`);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook handling failed' });
  }
}

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}