import { User } from '@/models';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    await user.update({
      resetToken,
      resetTokenExpiry
    });

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${req.headers.origin || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('Password Reset Link:', resetUrl);
    console.log('This would be sent to:', email);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // In development, include the reset link for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}