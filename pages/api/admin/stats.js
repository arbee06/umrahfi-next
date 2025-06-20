import { User, Package, Order } from '@/models';
import { isAdmin } from '@/middleware/auth';
import { Op } from 'sequelize';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await isAdmin(req, res);
  if (!authResult?.user) return;

  try {
    // Get counts
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalCompanies = await User.count({ where: { role: 'company' } });
    const totalPackages = await Package.count();
    const activePackages = await Package.count({ where: { status: 'active' } });
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const confirmedOrders = await Order.count({ where: { status: 'confirmed' } });

    // Get revenue data
    const orders = await Order.findAll({ 
      where: { 
        status: { 
          [Op.in]: ['confirmed', 'completed'] 
        } 
      },
      attributes: ['totalAmount']
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

    // Get recent activity
    const recentUsers = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentOrders = await Order.findAll({
      include: [
        { 
          model: User, 
          as: 'customer', 
          attributes: ['name', 'email'] 
        },
        { 
          model: Package, 
          as: 'package', 
          attributes: ['title'] 
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          companies: totalCompanies
        },
        packages: {
          total: totalPackages,
          active: activePackages
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders
        },
        revenue: {
          total: totalRevenue
        }
      },
      recentActivity: {
        users: recentUsers,
        orders: recentOrders
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}