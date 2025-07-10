-- Migration to add country field to users table
-- Date: 2025-07-02

-- Add country column to users table
ALTER TABLE users 
ADD COLUMN country VARCHAR(255) DEFAULT NULL;

-- Update existing company users to prompt them to set their country
-- (Companies will need to update their profiles to set their country)

-- Add index for faster country-based queries
CREATE INDEX idx_users_country ON users(country);