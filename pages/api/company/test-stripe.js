import { authMiddleware } from '@/middleware/auth';
import Stripe from 'stripe';

export default async function handler(req, res) {
  // Apply auth middleware for company users only
  const authResult = await authMiddleware(['company'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stripeSecretKey } = req.body;

    if (!stripeSecretKey) {
      return res.status(400).json({ 
        error: 'Stripe secret key is required' 
      });
    }

    if (!stripeSecretKey.startsWith('sk_')) {
      return res.status(400).json({ 
        error: 'Invalid Stripe secret key format' 
      });
    }

    // Initialize Stripe with the provided key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Test the connection by retrieving account information
    const account = await stripe.accounts.retrieve();

    // Check if the account is valid and active
    if (!account) {
      throw new Error('Unable to retrieve Stripe account information');
    }

    return res.status(200).json({
      success: true,
      message: 'Stripe connection successful',
      account: {
        id: account.id,
        display_name: account.display_name,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        type: account.type
      }
    });

  } catch (error) {
    console.error('Stripe connection test error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid Stripe API key'
      });
    }

    if (error.type === 'StripePermissionError') {
      return res.status(403).json({
        success: false,
        error: 'This API key does not have sufficient permissions'
      });
    }

    if (error.type === 'StripeConnectionError') {
      return res.status(503).json({
        success: false,
        error: 'Unable to connect to Stripe. Please check your internet connection.'
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to test Stripe connection'
    });
  }
}