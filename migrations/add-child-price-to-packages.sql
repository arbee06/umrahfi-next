-- Add child price column to packages table
ALTER TABLE packages ADD COLUMN childPrice DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER price;

-- Update existing packages to have a default child price (75% of adult price)
UPDATE packages SET childPrice = price * 0.75 WHERE childPrice = 0;