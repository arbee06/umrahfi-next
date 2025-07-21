import { authMiddleware } from '@/middleware/auth';
import { User, Package } from '@/models';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Apply auth middleware (optional for browsing)
    const authResult = await authMiddleware([])(req, res);

    // Fetch company details with packages
    const company = await User.findOne({
      where: {
        id: id,
        role: 'company'
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
          where: { isActive: true },
          required: false,
          attributes: [
            'id',
            'title',
            'description',
            'price',
            'duration',
            'rating',
            'destination',
            'transportation',
            'accommodation',
            'createdAt'
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        profilePicture: company.profilePicture,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
        subscriptionPlan: company.subscriptionPlan,
        subscriptionStatus: company.subscriptionStatus,
        joinedDate: company.createdAt
      },
      packages: company.packages || []
    });

  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company details'
    });
  }
}