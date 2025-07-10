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
      bankAddress
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