import { authMiddleware } from '@/middleware/auth';
import { User } from '@/models';

export default async function handler(req, res) {
  // Apply auth middleware for admin only
  const authResult = await authMiddleware(['admin'])(req, res);
  if (!authResult || !authResult.user) {
    return; // Response already sent by middleware
  }

  const { method } = req;

  if (method === 'GET') {
    try {
      // Get all company users with their subscription information
      const companies = await User.findAll({
        where: { 
          role: 'company'
        },
        attributes: [
          'id', 'name', 'email', 'companyName', 'phone', 'country',
          'subscriptionStatus', 'subscriptionPlan', 'subscriptionStartDate', 
          'subscriptionEndDate', 'trialEndDate', 'subscriptionFeatures',
          'isActive', 'isVerified', 'createdAt'
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transform the data to include subscription information
      const companiesWithSubscriptions = companies.map(company => ({
        ...company.toJSON(),
        subscriptionFeatures: company.subscriptionFeatures || {
          maxPackages: 0,
          maxBookingsPerMonth: 0,
          maxPhotosPerPackage: 0,
          prioritySupport: false,
          featuredListings: false,
          analyticsAccess: false
        }
      }));

      return res.status(200).json({
        success: true,
        companies: companiesWithSubscriptions
      });
    } catch (error) {
      console.error('Error fetching company subscriptions:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch company subscriptions' 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}