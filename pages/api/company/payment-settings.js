import { authMiddleware } from '@/middleware/auth';
import User from '@/models/User';

export default async function handler(req, res) {
  // Apply auth middleware for company users only
  const authResult = await authMiddleware(['company'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { user } = authResult;

  if (req.method === 'PUT') {
    try {
      const {
        preferredPaymentMethods,
        stripePublishableKey,
        stripeSecretKey,
        stripeWebhookSecret,
        paymentProcessingFee,
        acceptCashPayments,
        acceptBankTransfers
      } = req.body;

      // Validation
      if (!preferredPaymentMethods || !Array.isArray(preferredPaymentMethods)) {
        return res.status(400).json({ error: 'Preferred payment methods must be an array' });
      }

      if (preferredPaymentMethods.length === 0) {
        return res.status(400).json({ error: 'At least one payment method must be selected' });
      }

      const validMethods = ['stripe', 'bank_transfer', 'cash'];
      const invalidMethods = preferredPaymentMethods.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        return res.status(400).json({ 
          error: `Invalid payment methods: ${invalidMethods.join(', ')}` 
        });
      }

      // Validate Stripe keys if provided
      if (stripePublishableKey && !stripePublishableKey.startsWith('pk_')) {
        return res.status(400).json({ 
          error: 'Stripe publishable key must start with "pk_"' 
        });
      }

      if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
        return res.status(400).json({ 
          error: 'Stripe secret key must start with "sk_"' 
        });
      }

      if (stripeWebhookSecret && !stripeWebhookSecret.startsWith('whsec_')) {
        return res.status(400).json({ 
          error: 'Stripe webhook secret must start with "whsec_"' 
        });
      }

      // Validate processing fee
      if (paymentProcessingFee !== undefined) {
        const fee = parseFloat(paymentProcessingFee);
        if (isNaN(fee) || fee < 0 || fee > 10) {
          return res.status(400).json({ 
            error: 'Payment processing fee must be between 0 and 10%' 
          });
        }
      }

      // Update user payment configuration
      const updateData = {
        preferredPaymentMethods,
        paymentProcessingFee: paymentProcessingFee || 2.9,
        acceptCashPayments: acceptCashPayments !== false,
        acceptBankTransfers: acceptBankTransfers !== false
      };

      // Only update Stripe keys if they are provided
      if (stripePublishableKey !== undefined) {
        updateData.stripePublishableKey = stripePublishableKey || null;
      }
      
      if (stripeSecretKey !== undefined) {
        updateData.stripeSecretKey = stripeSecretKey || null;
      }
      
      if (stripeWebhookSecret !== undefined) {
        updateData.stripeWebhookSecret = stripeWebhookSecret || null;
      }

      await User.update(updateData, {
        where: { id: user.id }
      });

      // Fetch updated user data
      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
      });

      return res.status(200).json({
        success: true,
        message: 'Payment settings updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error updating payment settings:', error);
      return res.status(500).json({ 
        error: 'Failed to update payment settings. Please try again.' 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      // Return current payment configuration (excluding secret keys for security)
      const paymentConfig = {
        preferredPaymentMethods: user.preferredPaymentMethods || ['stripe', 'bank_transfer'],
        stripePublishableKey: user.stripePublishableKey || '',
        hasStripeSecretKey: !!user.stripeSecretKey,
        hasStripeWebhookSecret: !!user.stripeWebhookSecret,
        paymentProcessingFee: user.paymentProcessingFee || 2.9,
        acceptCashPayments: user.acceptCashPayments !== false,
        acceptBankTransfers: user.acceptBankTransfers !== false
      };

      return res.status(200).json({
        success: true,
        paymentConfig
      });

    } catch (error) {
      console.error('Error fetching payment settings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch payment settings. Please try again.' 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}