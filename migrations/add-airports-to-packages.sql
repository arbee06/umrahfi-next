-- Add airport fields to packages table
ALTER TABLE packages 
ADD COLUMN departureAirport VARCHAR(3) NULL AFTER childPrice,
ADD COLUMN arrivalAirport VARCHAR(3) NULL AFTER departureAirport,
ADD COLUMN transitAirport VARCHAR(3) NULL AFTER arrivalAirport;

-- Add indexes for airport searching
CREATE INDEX idx_packages_departure_airport ON packages(departureAirport);
CREATE INDEX idx_packages_arrival_airport ON packages(arrivalAirport);
CREATE INDEX idx_packages_transit_airport ON packages(transitAirport);