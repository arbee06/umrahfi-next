import { authMiddleware } from '@/middleware/auth';
import { getSubscriptionWarnings } from '@/middleware/subscriptionMiddleware';

export default async function handler(req, res) {
  // Apply auth middleware for company users only
  const authResult = await authMiddleware(['company'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method } = req;

  if (method === 'GET') {
    try {
      const companyId = authResult.user.id;
      const warnings = await getSubscriptionWarnings(companyId);

      return res.status(200).json({
        success: true,
        ...warnings
      });
    } catch (error) {
      console.error('Error fetching subscription warnings:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch subscription warnings' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}