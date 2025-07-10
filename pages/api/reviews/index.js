// pages/api/reviews/index.js
import { authMiddleware } from '@/middleware/auth';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Package from '@/models/Package';
import User from '@/models/User';
import { Op } from 'sequelize';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { packageId, companyId, customerId, orderId } = req.query;
      
      const where = {};
      if (packageId) where.packageId = packageId;
      if (companyId) where.companyId = companyId;
      if (customerId) where.customerId = customerId;
      if (orderId) where.orderId = orderId;
      
      const reviews = await Review.findAll({
        where,
        attributes: ['id', 'rating', 'title', 'comment', 'serviceRating', 'accommodationRating', 'transportRating', 'valueRating', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json(reviews);
    }
    
    if (req.method === 'POST') {
      // Apply auth middleware - only customers can create reviews
      const authResult = await authMiddleware(['customer'])(req, res);
      if (!authResult || !authResult.user) {
        return; // Response already sent by middleware
      }
      
      const {
        orderId,
        rating,
        title,
        comment,
        serviceRating,
        accommodationRating,
        transportRating,
        valueRating,
        photos
      } = req.body;
      
      // Validate that the order exists and belongs to the customer
      const order = await Order.findOne({
        where: {
          id: orderId,
          customerId: authResult.user.id,
          status: 'completed'
        }
      });
      
      if (!order) {
        return res.status(404).json({ 
          error: 'Order not found or not eligible for review' 
        });
      }
      
      // Check if review already exists for this order
      const existingReview = await Review.findOne({
        where: { orderId }
      });
      
      if (existingReview) {
        return res.status(400).json({ 
          error: 'Review already exists for this order' 
        });
      }
      
      // Create the review with optional fields
      const review = await Review.create({
        orderId,
        packageId: order.packageId,
        companyId: order.companyId,
        customerId: authResult.user.id,
        rating,
        title: title || '',
        comment: comment || '',
        serviceRating: serviceRating || rating, // Default to overall rating if not provided
        accommodationRating: accommodationRating || rating,
        transportRating: transportRating || rating,
        valueRating: valueRating || rating,
        photos: photos || []
      });
      
      return res.status(201).json(review);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Reviews API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}