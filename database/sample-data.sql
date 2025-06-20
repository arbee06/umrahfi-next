-- Sample data for Umrahfi application

-- Insert sample users
INSERT INTO `users` (`name`, `email`, `password`, `role`, `companyName`, `companyLicense`, `companyAddress`, `phone`, `address`, `isActive`) VALUES
-- Admin user (password: admin123456)
('Admin User', 'admin@umrahfi.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.v1XJ5S6BO7/3AcQ7PpjJ1gLEzDMqey', 'admin', NULL, NULL, NULL, '+1234567890', 'Admin Office', 1),

-- Company users (password: company123)
('Al-Madinah Travel', 'info@almadinahtravel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.v1XJ5S6BO7/3AcQ7PpjJ1gLEzDMqey', 'company', 'Al-Madinah Travel & Tours', 'LIC001', '123 Main Street, Riyadh, Saudi Arabia', '+966123456789', '123 Main Street, Riyadh', 1),

('Mecca Pilgrimage Co', 'contact@meccapilgrimage.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.v1XJ5S6BO7/3AcQ7PpjJ1gLEzDMqey', 'company', 'Mecca Pilgrimage Company', 'LIC002', '456 Holy Street, Mecca, Saudi Arabia', '+966987654321', '456 Holy Street, Mecca', 1),

-- Customer users (password: customer123)
('Ahmed Al-Rashid', 'ahmed@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.v1XJ5S6BO7/3AcQ7PpjJ1gLEzDMqey', 'customer', NULL, NULL, NULL, '+966555123456', 'Jeddah, Saudi Arabia', 1),

('Fatima Hassan', 'fatima@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.v1XJ5S6BO7/3AcQ7PpjJ1gLEzDMqey', 'customer', NULL, NULL, NULL, '+966555987654', 'Dubai, UAE', 1);

-- Insert sample packages
INSERT INTO `packages` (`title`, `description`, `price`, `duration`, `departureDate`, `returnDate`, `availableSeats`, `totalSeats`, `inclusions`, `exclusions`, `itinerary`, `hotelName`, `hotelRating`, `mealPlan`, `transportation`, `companyId`, `status`) VALUES

('Premium Umrah Package 2024', 'Experience the spiritual journey of Umrah with our premium package including 5-star accommodation, guided tours, and comfortable transportation.', 2500.00, 14, '2024-03-15', '2024-03-29', 20, 25, 
'["Round-trip flights", "5-star hotel accommodation", "Daily breakfast and dinner", "Airport transfers", "Guided Ziyarat tours", "Visa processing", "24/7 customer support"]', 
'["Personal expenses", "Shopping", "Optional tours", "Travel insurance", "Excess baggage fees"]',
'[{"day": 1, "description": "Arrival in Jeddah, transfer to Mecca hotel"}, {"day": 2, "description": "Umrah rituals at Masjid al-Haram"}, {"day": 3, "description": "Ziyarat tours in Mecca"}, {"day": 8, "description": "Travel to Medina"}, {"day": 14, "description": "Departure"}]',
'Fairmont Makkah Clock Royal Tower', 5, 'Half Board', 'Flight', 2, 'active'),

('Economy Umrah Package', 'Affordable Umrah package with comfortable 3-star accommodation and essential services for a meaningful spiritual journey.', 1200.00, 10, '2024-04-10', '2024-04-20', 30, 35,
'["Round-trip flights", "3-star hotel accommodation", "Daily breakfast", "Airport transfers", "Basic Ziyarat tours", "Visa processing"]',
'["Lunch and dinner", "Personal expenses", "Shopping", "Optional tours", "Travel insurance"]',
'[{"day": 1, "description": "Arrival and hotel check-in"}, {"day": 2, "description": "Umrah performance"}, {"day": 6, "description": "Travel to Medina"}, {"day": 10, "description": "Departure"}]',
'Hilton Suites Makkah', 3, 'Breakfast', 'Flight', 2, 'active'),

('Luxury Umrah Experience', 'Ultimate luxury Umrah package with presidential suite accommodation, private transfers, and exclusive services.', 5000.00, 21, '2024-05-01', '2024-05-22', 8, 10,
'["First-class flights", "Presidential suite accommodation", "All meals included", "Private transfers", "VIP Ziyarat tours", "Personal guide", "Visa processing", "Laundry service"]',
'["Personal shopping", "Spa services", "International calls"]',
'[{"day": 1, "description": "VIP arrival and luxury hotel check-in"}, {"day": 2, "description": "Private Umrah guidance"}, {"day": 3, "description": "Exclusive Mecca tours"}, {"day": 12, "description": "Luxury travel to Medina"}, {"day": 21, "description": "VIP departure"}]',
'Conrad Makkah', 5, 'All Inclusive', 'Private Car', 3, 'active');

-- Insert sample orders
INSERT INTO `orders` (`customerId`, `packageId`, `companyId`, `orderNumber`, `numberOfTravelers`, `travelers`, `totalAmount`, `paymentStatus`, `status`, `specialRequests`) VALUES

(4, 1, 2, 'ORD-1704067200-ABC123DEF', 2, 
'[{"name": "Ahmed Al-Rashid", "passportNumber": "A12345678", "dateOfBirth": "1985-03-15", "gender": "male"}, {"name": "Amina Al-Rashid", "passportNumber": "A87654321", "dateOfBirth": "1990-07-22", "gender": "female"}]',
5000.00, 'completed', 'confirmed', 'Please arrange wheel chair assistance for elderly mother'),

(5, 2, 2, 'ORD-1704153600-XYZ789GHI', 1,
'[{"name": "Fatima Hassan", "passportNumber": "B11111111", "dateOfBirth": "1992-12-10", "gender": "female"}]',
1200.00, 'pending', 'pending', 'First time Umrah, need guidance');