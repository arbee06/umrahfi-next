-- Migration: Update paymentMethod ENUM to support new payment methods
-- Date: 2025-06-27
-- Description: Updates the paymentMethod column to support 'stripe', 'bank_transfer', and 'cash'

-- First, check current enum values
-- SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentMethod';

-- Update the ENUM to include new values
ALTER TABLE `orders` 
MODIFY COLUMN `paymentMethod` ENUM('stripe', 'bank_transfer', 'cash', 'credit_card') 
DEFAULT 'stripe' NOT NULL;

-- Update any existing 'credit_card' entries to 'stripe'
UPDATE `orders` SET `paymentMethod` = 'stripe' WHERE `paymentMethod` = 'credit_card';

-- Remove the old 'credit_card' option from ENUM
ALTER TABLE `orders` 
MODIFY COLUMN `paymentMethod` ENUM('stripe', 'bank_transfer', 'cash') 
DEFAULT 'stripe' NOT NULL;

-- Verify the changes
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'paymentMethod';