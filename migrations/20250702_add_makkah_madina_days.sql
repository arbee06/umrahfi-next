-- Add Makkah and Madina days fields to packages table
ALTER TABLE packages 
ADD COLUMN makkah_days INTEGER NOT NULL DEFAULT 7 CHECK (makkah_days >= 1),
ADD COLUMN madina_days INTEGER NOT NULL DEFAULT 3 CHECK (madina_days >= 1);

-- Add comment for documentation
COMMENT ON COLUMN packages.makkah_days IS 'Number of days to be spent in Makkah';
COMMENT ON COLUMN packages.madina_days IS 'Number of days to be spent in Madina';