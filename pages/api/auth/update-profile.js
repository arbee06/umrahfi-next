import { authMiddleware } from '@/middleware/auth';
const User = require('../../../models/User');

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply auth middleware
  const authResult = await authMiddleware([])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  try {
    const userId = authResult.user.id;
    const {
      name,
      phone,
      address,
      country,
      companyName,
      companyLicense,
      companyAddress,
      bankName,
      bankAccountNumber,
      bankAccountHolderName,
      bankRoutingNumber,
      bankSwiftCode,
      bankAddress,
      // Payment Configuration
      preferredPaymentMethods,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      paymentProcessingFee,
      acceptCashPayments,
      acceptBankTransfers
    } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData = {
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
      country: country || user.country
    };

    // Add company-specific fields if user is a company
    if (user.role === 'company') {
      updateData.companyName = companyName || user.companyName;
      updateData.companyLicense = companyLicense || user.companyLicense;
      updateData.companyAddress = companyAddress || user.companyAddress;
    }

    // Add banking information
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankAccountHolderName !== undefined) updateData.bankAccountHolderName = bankAccountHolderName;
    if (bankRoutingNumber !== undefined) updateData.bankRoutingNumber = bankRoutingNumber;
    if (bankSwiftCode !== undefined) updateData.bankSwiftCode = bankSwiftCode;
    if (bankAddress !== undefined) updateData.bankAddress = bankAddress;

    // Add payment configuration for companies
    if (user.role === 'company') {
      // Validate payment methods
      if (preferredPaymentMethods !== undefined) {
        if (!Array.isArray(preferredPaymentMethods)) {
          return res.status(400).json({ error: 'Preferred payment methods must be an array' });
        }
        const validMethods = ['stripe', 'bank_transfer', 'cash'];
        const invalidMethods = preferredPaymentMethods.filter(method => !validMethods.includes(method));
        if (invalidMethods.length > 0) {
          return res.status(400).json({ 
            error: `Invalid payment methods: ${invalidMethods.join(', ')}` 
          });
        }
        updateData.preferredPaymentMethods = preferredPaymentMethods;
      }

      // Validate Stripe keys if provided
      if (stripePublishableKey !== undefined) {
        if (stripePublishableKey && !stripePublishableKey.startsWith('pk_')) {
          return res.status(400).json({ 
            error: 'Stripe publishable key must start with "pk_"' 
          });
        }
        updateData.stripePublishableKey = stripePublishableKey || null;
      }

      if (stripeSecretKey !== undefined) {
        if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
          return res.status(400).json({ 
            error: 'Stripe secret key must start with "sk_"' 
          });
        }
        updateData.stripeSecretKey = stripeSecretKey || null;
      }

      if (stripeWebhookSecret !== undefined) {
        if (stripeWebhookSecret && !stripeWebhookSecret.startsWith('whsec_')) {
          return res.status(400).json({ 
            error: 'Stripe webhook secret must start with "whsec_"' 
          });
        }
        updateData.stripeWebhookSecret = stripeWebhookSecret || null;
      }

      // Validate processing fee
      if (paymentProcessingFee !== undefined) {
        const fee = parseFloat(paymentProcessingFee);
        if (isNaN(fee) || fee < 0 || fee > 10) {
          return res.status(400).json({ 
            error: 'Payment processing fee must be between 0 and 10%' 
          });
        }
        updateData.paymentProcessingFee = fee;
      }

      if (acceptCashPayments !== undefined) {
        updateData.acceptCashPayments = acceptCashPayments;
      }

      if (acceptBankTransfers !== undefined) {
        updateData.acceptBankTransfers = acceptBankTransfers;
      }
    }

    // Update user
    await user.update(updateData);

    // Remove sensitive fields before sending response
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}