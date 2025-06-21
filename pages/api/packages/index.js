import { Package, User } from '@/models';
import { authMiddleware } from '@/middleware/auth';
import { Op } from 'sequelize';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const { 
          page = 1, 
          limit = 10, 
          minPrice, 
          maxPrice, 
          startDate, 
          endDate,
          company,
          country,
          departureAirport,
          arrivalAirport,
          guests,
          status = 'active'
        } = req.query;

        const where = { status };

        if (minPrice || maxPrice) {
          where.price = {};
          if (minPrice) where.price[Op.gte] = Number(minPrice);
          if (maxPrice) where.price[Op.lte] = Number(maxPrice);
        }

        if (startDate || endDate) {
          where.departureDate = {};
          if (startDate) where.departureDate[Op.gte] = new Date(startDate);
          if (endDate) where.departureDate[Op.lte] = new Date(endDate);
        }

        if (company) {
          where.companyId = company;
        }

        if (country) {
          where.country = country;
        }

        if (departureAirport) {
          where.departureAirport = departureAirport;
        }

        if (arrivalAirport) {
          where.arrivalAirport = arrivalAirport;
        }

        if (guests) {
          where.availableSeats = {
            [Op.gte]: Number(guests)
          };
        }

        const offset = (page - 1) * limit;

        const { count, rows: packages } = await Package.findAndCountAll({
          where,
          include: [
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName', 'email', 'phone']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: Number(limit),
          offset: Number(offset)
        });

        res.status(200).json({
          success: true,
          packages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        });
      } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'POST':
      const authResult = await authMiddleware(['company', 'admin'])(req, res);
      if (!authResult?.user) return;

      try {
        const packageData = {
          ...req.body,
          companyId: authResult.user.role === 'company' ? authResult.user.id : req.body.companyId
        };

        const newPackage = await Package.create(packageData);
        
        res.status(201).json({
          success: true,
          package: newPackage
        });
      } catch (error) {
        console.error('Create package error:', error);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}