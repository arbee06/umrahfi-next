import { authMiddleware } from '@/middleware/auth';
import { getUpgradeSuggestions } from '@/middleware/subscriptionMiddleware';

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
      const suggestions = await getUpgradeSuggestions(companyId);

      return res.status(200).json({
        success: true,
        ...suggestions
      });
    } catch (error) {
      console.error('Error fetching upgrade suggestions:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch upgrade suggestions' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}