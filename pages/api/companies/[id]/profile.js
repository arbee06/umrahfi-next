// pages/api/companies/[id]/profile.js
import User from '@/models/User';
import Package from '@/models/Package';
import Review from '@/models/Review';
import Order from '@/models/Order';
import { Op } from 'sequelize';
const sequelize = require('@/lib/database');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get company details
    const company = await User.findOne({
      where: { 
        id,
        role: 'company'
      },
      attributes: [
        'id', 'name', 'email', 'companyName', 'companyLicense', 
        'companyAddress', 'country', 'profilePicture', 'createdAt'
      ]
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get total packages count
    const totalPackages = await Package.count({
      where: { 
        companyId: id,
        status: 'active'
      }
    });
    
    // Get popular packages (most booked)
    const popularPackages = await Package.findAll({
      where: { 
        companyId: id,
        status: 'active'
      },
      attributes: [
        'id', 'name', 'type', 'price', 'duration', 'departureDate',
        'makkahHotels', 'madinahHotels', 'departureAirports', 'arrivalAirports',
        [sequelize.literal('(SELECT COUNT(*) FROM orders WHERE orders.packageId = Package.id)'), 'bookingCount']
      ],
      order: [[sequelize.literal('bookingCount'), 'DESC']],
      limit: 6
    });
    
    // Get review statistics
    const reviewStats = await Review.findOne({
      where: { companyId: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
        [sequelize.fn('AVG', sequelize.col('serviceRating')), 'averageServiceRating'],
        [sequelize.fn('AVG', sequelize.col('accommodationRating')), 'averageAccommodationRating'],
        [sequelize.fn('AVG', sequelize.col('transportRating')), 'averageTransportRating'],
        [sequelize.fn('AVG', sequelize.col('valueRating')), 'averageValueRating']
      ],
      raw: true
    });
    
    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: { companyId: id },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      raw: true
    });
    
    // Get completed bookings count
    const completedBookings = await Order.count({
      where: {
        companyId: id,
        status: 'completed'
      }
    });
    
    // Format the response
    const profile = {
      company: company.toJSON(),
      statistics: {
        totalPackages,
        completedBookings,
        averageRating: parseFloat(reviewStats?.averageRating || 0).toFixed(1),
        totalReviews: parseInt(reviewStats?.totalReviews || 0),
        ratings: {
          service: parseFloat(reviewStats?.averageServiceRating || 0).toFixed(1),
          accommodation: parseFloat(reviewStats?.averageAccommodationRating || 0).toFixed(1),
          transport: parseFloat(reviewStats?.averageTransportRating || 0).toFixed(1),
          value: parseFloat(reviewStats?.averageValueRating || 0).toFixed(1)
        },
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      },
      popularPackages
    };
    
    // Fill rating distribution
    ratingDistribution.forEach(item => {
      profile.statistics.distribution[item.rating] = parseInt(item.count);
    });
    
    return res.status(200).json(profile);
    
  } catch (error) {
    console.error('Company profile API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}