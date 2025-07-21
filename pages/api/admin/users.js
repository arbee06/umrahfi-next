import { User, Package, Order } from '@/models';
import { isAdmin } from '@/middleware/auth';
import { Op } from 'sequelize';

/**
 * Handle cascading effects when deactivating a user
 * @param {Object} user - The user being deactivated
 */
async function handleUserDeactivation(user) {
  if (user.role === 'customer') {
    // Deactivate all ongoing orders for this customer
    await Order.update(
      { status: 'cancelled' },
      {
        where: {
          customerId: user.id,
          status: { 
            [Op.in]: ['pending', 'confirmed'] 
          }
        }
      }
    );
    console.log(`Cancelled ongoing orders for customer: ${user.email}`);
    
  } else if (user.role === 'company') {
    // Deactivate all packages from this company
    await Package.update(
      { status: 'inactive' },
      {
        where: {
          companyId: user.id,
          status: 'active'
        }
      }
    );
    console.log(`Deactivated packages for company: ${user.email}`);
    
    // Deactivate all ongoing orders for packages from this company
    const companyPackages = await Package.findAll({
      where: { companyId: user.id },
      attributes: ['id']
    });
    
    const packageIds = companyPackages.map(pkg => pkg.id);
    
    if (packageIds.length > 0) {
      await Order.update(
        { status: 'cancelled' },
        {
          where: {
            packageId: { [Op.in]: packageIds },
            status: { 
              [Op.in]: ['pending', 'confirmed'] 
            }
          }
        }
      );
      console.log(`Cancelled ongoing orders for company packages: ${user.email}`);
    }
  }
}

export default async function handler(req, res) {
  const authResult = await isAdmin(req, res);
  if (!authResult?.user) return;

  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, limit = 10, role, search, isActive } = req.query;
        const offset = (page - 1) * limit;

        let where = {};
        
        if (role) {
          where.role = role;
        }

        if (search) {
          where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { companyName: { [Op.iLike]: `%${search}%` } }
          ];
        }

        if (isActive !== undefined && isActive !== null && isActive !== '') {
          where.isActive = isActive === 'true';
        }

        const { count, rows: users } = await User.findAndCountAll({
          where,
          attributes: { exclude: ['password'] },
          order: [['createdAt', 'DESC']],
          limit: Number(limit),
          offset: Number(offset)
        });

        // Add booking counts for customers
        const usersWithBookingCounts = await Promise.all(
          users.map(async (user) => {
            const userObj = user.toJSON();
            if (user.role === 'customer') {
              const bookingCount = await Order.count({
                where: { customerId: user.id }
              });
              userObj.bookingCount = bookingCount;
            } else {
              userObj.bookingCount = 0;
            }
            return userObj;
          })
        );

        res.status(200).json({
          success: true,
          users: usersWithBookingCounts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        });
      } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'POST':
      try {
        const userData = req.body;
        
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password || !userData.role) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          where: { email: userData.email }
        });

        if (existingUser) {
          return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Create the user
        const newUser = await User.create(userData);

        // Return user without password
        const userResponse = await User.findByPk(newUser.id, {
          attributes: { exclude: ['password'] }
        });

        res.status(201).json({
          success: true,
          user: userResponse
        });
      } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'PUT':
      try {
        const { userId, updates } = req.body;

        // Handle password updates separately for security
        const { password, confirmPassword, ...otherUpdates } = updates;
        
        // If password is provided, validate it
        if (password) {
          if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
          }
          otherUpdates.password = password;
        }

        const user = await User.findByPk(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Handle cascading effects when deactivating users
        if (otherUpdates.hasOwnProperty('isActive') && !otherUpdates.isActive) {
          await handleUserDeactivation(user);
        }

        await user.update(otherUpdates);

        // Return user without password
        const updatedUser = await User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });

        res.status(200).json({
          success: true,
          user: updatedUser
        });
      } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}