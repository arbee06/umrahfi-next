-- Migration: Add payment fields to orders table and bank information to users table
-- Run this SQL script to update your database schema

-- Add payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN paymentMethod ENUM('credit_card', 'bank_transfer') DEFAULT 'credit_card',
ADD COLUMN paymentReceiptPath VARCHAR(500) NULL,
ADD COLUMN paymentReceiptOriginalName VARCHAR(255) NULL,
ADD COLUMN paymentNotes TEXT NULL,
ADD COLUMN paymentVerified BOOLEAN DEFAULT FALSE,
ADD COLUMN paymentVerifiedAt TIMESTAMP NULL,
ADD COLUMN paymentVerifiedBy INT NULL;

-- Add foreign key constraint for paymentVerifiedBy
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_payment_verified_by 
FOREIGN KEY (paymentVerifiedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Add bank information columns to users table (for companies)
ALTER TABLE users 
ADD COLUMN bankName VARCHAR(255) NULL,
ADD COLUMN bankAccountNumber VARCHAR(100) NULL,
ADD COLUMN bankAccountHolderName VARCHAR(255) NULL,
ADD COLUMN bankRoutingNumber VARCHAR(50) NULL,
ADD COLUMN bankSwiftCode VARCHAR(20) NULL,
ADD COLUMN bankAddress TEXT NULL;

-- Add index for payment method queries
CREATE INDEX idx_orders_payment_method ON orders(paymentMethod);
CREATE INDEX idx_orders_payment_verified ON orders(paymentVerified);

-- Update existing orders to have default payment method
UPDATE orders SET paymentMethod = 'credit_card' WHERE paymentMethod IS NULL;