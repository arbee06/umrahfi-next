-- Migration: Update existing payment methods from credit_card to stripe
-- Date: 2025-06-27
-- Description: Updates existing orders to use new payment method values

-- Update existing orders with credit_card payment method to stripe
UPDATE `orders` 
SET `paymentMethod` = 'stripe' 
WHERE `paymentMethod` = 'credit_card';

-- Verify the update
SELECT 
    paymentMethod, 
    COUNT(*) as count 
FROM `orders` 
GROUP BY paymentMethod;