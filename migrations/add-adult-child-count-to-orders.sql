-- Add adult and child count columns to orders table
ALTER TABLE orders 
ADD COLUMN numberOfAdults INTEGER NOT NULL DEFAULT 1 AFTER numberOfTravelers,
ADD COLUMN numberOfChildren INTEGER NOT NULL DEFAULT 0 AFTER numberOfAdults;

-- Update existing orders to set numberOfAdults = numberOfTravelers
UPDATE orders SET numberOfAdults = numberOfTravelers WHERE numberOfAdults = 1;