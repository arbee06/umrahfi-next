-- Migration to add 'draft' status to orders table
-- Run this SQL command in your database

ALTER TABLE `orders` 
MODIFY COLUMN `status` ENUM('draft', 'pending', 'confirmed', 'cancelled', 'completed') 
DEFAULT 'pending';