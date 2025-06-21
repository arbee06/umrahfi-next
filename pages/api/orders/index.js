import { Order, Package, User, Passport, Visa } from '@/models';
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      const authResultGet = await authMiddleware([])(req, res);
      if (!authResultGet?.user) return;

      try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let where = {};
        
        if (authResultGet.user.role === 'customer') {
          where.customerId = authResultGet.user.id;
        } else if (authResultGet.user.role === 'company') {
          where.companyId = authResultGet.user.id;
        }

        if (status) {
          where.status = status;
        }

        const { count, rows: orders } = await Order.findAndCountAll({
          where,
          include: [
            {
              model: Package,
              as: 'package',
              attributes: ['id', 'title', 'price', 'departureDate']
            },
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'name', 'email', 'phone']
            },
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: Number(limit),
          offset: Number(offset)
        });

        res.status(200).json({
          success: true,
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        });
      } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    case 'POST':
      const authResultPost = await authMiddleware(['customer'])(req, res);
      if (!authResultPost?.user) return;

      try {
        const { 
          packageId, 
          numberOfTravelers,
          numberOfAdults,
          numberOfChildren, 
          travelers, 
          specialRequests,
          paymentMethod,
          paymentReceiptPath,
          paymentReceiptOriginalName,
          paymentNotes
        } = req.body;

        // Validate package exists and has seats
        const packageData = await Package.findByPk(packageId, {
          include: [
            {
              model: User,
              as: 'company',
              attributes: ['id', 'companyName']
            }
          ]
        });
        
        if (!packageData) {
          return res.status(404).json({ error: 'Package not found' });
        }

        if (packageData.availableSeats < numberOfTravelers) {
          return res.status(400).json({ error: 'Not enough seats available' });
        }

        // Generate unique order number
        const generateOrderNumber = () => {
          const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
          const randomSuffix = Math.random().toString(36).substring(2, 11).toUpperCase();
          return `ORD-${timestamp}-${randomSuffix}`;
        };

        // Calculate total amount with adult and child pricing
        const totalAmount = (packageData.price * numberOfAdults) + (packageData.childPrice * numberOfChildren);

        // Create order
        const orderData = {
          customerId: authResultPost.user.id,
          packageId: packageId,
          companyId: packageData.companyId,
          orderNumber: generateOrderNumber(),
          numberOfTravelers,
          numberOfAdults,
          numberOfChildren,
          travelers,
          totalAmount,
          specialRequests,
          paymentMethod: paymentMethod || 'credit_card',
          paymentReceiptPath,
          paymentReceiptOriginalName,
          paymentNotes
        };

        const order = await Order.create(orderData);

        // Save passport data if available
        if (travelers && travelers.length > 0) {
          for (const traveler of travelers) {
            if (traveler.passportData) {
              const passportData = traveler.passportData;
              await Passport.create({
                orderId: order.id,
                passengerName: traveler.name,
                passportType: passportData.passport_type,
                countryCode: passportData.country_code,
                passportNumber: passportData.passport_number,
                surname: passportData.surname,
                givenNames: passportData.given_names,
                nationality: passportData.nationality,
                dateOfBirth: passportData.date_of_birth ? new Date(passportData.date_of_birth.split('/').reverse().join('-')) : null,
                placeOfBirth: passportData.place_of_birth,
                sex: passportData.sex,
                dateOfIssue: passportData.date_of_issue ? new Date(passportData.date_of_issue.split('/').reverse().join('-')) : null,
                dateOfExpiry: passportData.date_of_expiry ? new Date(passportData.date_of_expiry.split('/').reverse().join('-')) : null,
                issuingAuthority: passportData.issuing_authority,
                personalNumber: passportData.personal_number,
                additionalInfo: passportData.additional_info,
                mrzLine1: passportData.mrz_line1,
                mrzLine2: passportData.mrz_line2,
                fileHash: passportData.file_hash,
                imagePath: passportData.image_path
              });
            }

            // Save visa data if available
            if (traveler.visaFileInfo) {
              await Visa.create({
                orderId: order.id,
                passengerName: traveler.name,
                fileHash: traveler.visaFileInfo.file_hash,
                imagePath: traveler.visaFileInfo.image_path
              });
            }
          }
        }

        // Update available seats
        packageData.availableSeats -= numberOfTravelers;
        if (packageData.availableSeats === 0) {
          packageData.status = 'soldout';
        }
        await packageData.save();

        res.status(201).json({
          success: true,
          order
        });
      } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}