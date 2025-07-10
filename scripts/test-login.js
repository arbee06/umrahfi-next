const sequelize = require('../lib/database');
const User = require('../models/User');

async function testLogin() {
  try {
    console.log('Testing user login functionality...');

    // Test fetching a company user
    const testUser = await User.findOne({
      where: { email: 'info@almadinahtravel.com' },
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });

    if (testUser) {
      console.log('✅ User found successfully');
      console.log('Company Name:', testUser.companyName);
      console.log('Preferred Payment Methods:', testUser.preferredPaymentMethods);
      console.log('Stripe Publishable Key:', testUser.stripePublishableKey ? 'Set' : 'Not set');
      console.log('Payment Processing Fee:', testUser.paymentProcessingFee);
      console.log('Accept Cash Payments:', testUser.acceptCashPayments);
      console.log('Accept Bank Transfers:', testUser.acceptBankTransfers);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();