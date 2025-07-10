-- Migration to update packages table for multiple airports and hotels
-- Date: 2025-07-02

-- Add new JSON columns for multiple airports and hotels
ALTER TABLE packages 
ADD COLUMN departure_airports JSON DEFAULT '[]',
ADD COLUMN arrival_airports JSON DEFAULT '[]',
ADD COLUMN makkah_hotels JSON DEFAULT '[]',
ADD COLUMN madinah_hotels JSON DEFAULT '[]';

-- Migrate existing data from old single fields to new JSON arrays
UPDATE packages 
SET departure_airports = CASE 
    WHEN departureAirport IS NOT NULL AND departureAirport != '' 
    THEN JSON_ARRAY(departureAirport) 
    ELSE JSON_ARRAY() 
END;

UPDATE packages 
SET arrival_airports = CASE 
    WHEN arrivalAirport IS NOT NULL AND arrivalAirport != '' 
    THEN JSON_ARRAY(arrivalAirport) 
    ELSE JSON_ARRAY() 
END;

-- Migrate hotel data to Makkah hotels (assuming all existing hotels are in Makkah)
UPDATE packages 
SET makkah_hotels = CASE 
    WHEN hotelName IS NOT NULL AND hotelName != '' 
    THEN JSON_ARRAY(JSON_OBJECT('name', hotelName, 'rating', COALESCE(hotelRating, 3))) 
    ELSE JSON_ARRAY() 
END;

-- Set default Madinah hotel (can be updated by companies later)
UPDATE packages 
SET madinah_hotels = JSON_ARRAY(JSON_OBJECT('name', 'Standard Madinah Hotel', 'rating', 3))
WHERE makkah_hotels != JSON_ARRAY();

-- Drop old columns after migration
ALTER TABLE packages 
DROP COLUMN departureAirport,
DROP COLUMN arrivalAirport,
DROP COLUMN transitAirport,
DROP COLUMN hotelName,
DROP COLUMN hotelRating;

-- Drop old indexes
DROP INDEX IF EXISTS idx_packages_departureAirport ON packages;
DROP INDEX IF EXISTS idx_packages_arrivalAirport ON packages;
DROP INDEX IF EXISTS idx_packages_transitAirport ON packages;