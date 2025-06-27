import { Order, Package, User, Passport, Visa } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  const authResult = await authMiddleware([])(req, res);
  if (!authResult?.user) return;

  switch (req.method) {
    case 'GET':
      try {
        const order = await Order.findByPk(id, {
          include: [
            {
              model: Package,
              as: 'package'
            },
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'name', 'email', 'phone']
            },
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName', 'email', 'phone']
            },
            {
              model: Passport,
              as: 'passports'
            },
            {
              model: Visa,
              as: 'visas'
            }
          ]
        });

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        // Check access
        if (authResult.user.role === 'customer' && order.customerId !== authResult.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
        if (authResult.user.role === 'company' && order.companyId !== authResult.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.status(200).json({
          success: true,
          order
        });
      } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'PUT':
      try {
        const order = await Order.findByPk(id);

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        // Check access
        const canUpdate = 
          authResult.user.role === 'admin' ||
          (authResult.user.role === 'company' && order.companyId === authResult.user.id) ||
          (authResult.user.role === 'customer' && order.customerId === authResult.user.id);

        if (!canUpdate) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { status, paymentStatus, stripePaymentIntentId } = req.body;

        // Handle cancellation
        if (status === 'cancelled' && order.status !== 'cancelled') {
          // Return seats to package
          const packageData = await Package.findByPk(order.packageId);
          if (packageData) {
            packageData.availableSeats += order.numberOfTravelers;
            if (packageData.status === 'soldout' && packageData.availableSeats > 0) {
              packageData.status = 'active';
            }
            await packageData.save();
          }
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (stripePaymentIntentId) order.stripePaymentIntentId = stripePaymentIntentId;

        await order.save();

        res.status(200).json({
          success: true,
          order
        });
      } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}