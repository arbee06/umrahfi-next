import { authMiddleware } from '@/middleware/auth';
import { Package, User } from '@/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await authMiddleware(['customer'])(req, res);
  if (!authResult?.user) return;

  try {
    const { packageId } = req.query;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    // Get package with company information
    const packageData = await Package.findByPk(packageId, {
      include: [
        {
          model: User,
          as: 'company',
          attributes: ['id', 'stripePublishableKey', 'preferredPaymentMethods', 'acceptCashPayments', 'acceptBankTransfers']
        }
      ]
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const company = packageData.company;
    
    // Determine which Stripe key to use
    const stripePublishableKey = company?.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    // Get company payment preferences
    const paymentConfig = {
      stripePublishableKey,
      preferredPaymentMethods: company?.preferredPaymentMethods || ['stripe', 'bank_transfer'],
      acceptCashPayments: company?.acceptCashPayments !== false,
      acceptBankTransfers: company?.acceptBankTransfers !== false,
      companyName: company?.name || company?.companyName
    };

    res.status(200).json({
      success: true,
      paymentConfig
    });

  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
}