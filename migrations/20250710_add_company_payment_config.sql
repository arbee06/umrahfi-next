-- Add payment configuration fields for companies
-- Migration: 20250710_add_company_payment_config.sql

-- Add payment configuration columns
ALTER TABLE users 
ADD COLUMN preferredPaymentMethods JSON DEFAULT '["stripe", "bank_transfer"]' COMMENT 'Array of preferred payment methods: stripe, bank_transfer, cash',
ADD COLUMN stripePublishableKey VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe publishable key',
ADD COLUMN stripeSecretKey VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe secret key (encrypted)',
ADD COLUMN stripeWebhookSecret VARCHAR(500) DEFAULT NULL COMMENT 'Company Stripe webhook endpoint secret',
ADD COLUMN paymentProcessingFee DECIMAL(5,2) DEFAULT 2.90 COMMENT 'Payment processing fee percentage',
ADD COLUMN acceptCashPayments BOOLEAN DEFAULT TRUE COMMENT 'Whether company accepts cash payments',
ADD COLUMN acceptBankTransfers BOOLEAN DEFAULT TRUE COMMENT 'Whether company accepts bank transfers';

-- Update existing companies with default payment settings
UPDATE users 
SET 
  preferredPaymentMethods = '["stripe", "bank_transfer"]',
  paymentProcessingFee = 2.90,
  acceptCashPayments = TRUE,
  acceptBankTransfers = TRUE
WHERE role = 'company';