import { authMiddleware } from '@/middleware/auth';
import { User, Package, sequelize } from '@/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Make this endpoint publicly accessible for browsing
    // No auth middleware required

    // Fetch companies with their package counts and verification status
    const companies = await User.findAll({
      where: {
        role: 'company'
        // Remove isActive filter to see all companies first
      },
      attributes: [
        'id',
        'name',
        'email', 
        'phone',
        'address',
        'profilePicture',
        'isVerified',
        'verificationStatus',
        'subscriptionPlan',
        'subscriptionStatus',
        'createdAt'
      ],
      include: [
        {
          model: Package,
          as: 'packages',
          attributes: ['id', 'title', 'price', 'duration', 'createdAt'],
          where: { status: 'active' },
          required: false
        }
      ],
      order: [
        ['isVerified', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // Transform data to include computed fields
    const companiesWithStats = companies.map(company => {
      const packageCount = company.packages ? company.packages.length : 0;
      // Set default rating since rating field doesn't exist in packages table
      const avgRating = 4.5; // Default rating
      
      const recentPackages = company.packages 
        ? company.packages
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
        : [];

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        profilePicture: company.profilePicture,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
        subscriptionPlan: company.subscriptionPlan || 'free',
        subscriptionStatus: company.subscriptionStatus || 'inactive',
        packageCount,
        avgRating: Number(avgRating.toFixed(1)),
        recentPackages: recentPackages.map(pkg => ({
          id: pkg.id,
          title: pkg.title,
          price: pkg.price,
          duration: pkg.duration,
          rating: 4.5 // Default rating since field doesn't exist
        })),
        joinedDate: company.createdAt
      };
    });

    
    res.status(200).json({
      success: true,
      companies: companiesWithStats
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies'
    });
  }
}