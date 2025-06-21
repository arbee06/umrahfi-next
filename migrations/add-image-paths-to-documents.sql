-- Add image path columns to passport and visa tables
ALTER TABLE passports 
ADD COLUMN image_path VARCHAR(500) NULL AFTER file_hash;

ALTER TABLE visas 
ADD COLUMN image_path VARCHAR(500) NULL AFTER file_hash;