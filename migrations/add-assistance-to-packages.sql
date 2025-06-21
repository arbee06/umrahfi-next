-- Add assistance fields to packages table
ALTER TABLE packages 
ADD COLUMN includes_passport_assistance BOOLEAN DEFAULT FALSE,
ADD COLUMN includes_visa_assistance BOOLEAN DEFAULT FALSE,
ADD COLUMN passport_assistance_fee DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN visa_assistance_fee DECIMAL(10, 2) DEFAULT 0.00;