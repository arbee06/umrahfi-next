-- Umrahfi Database Schema
-- Create new database (optional)
-- CREATE DATABASE `umrahfi-next` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `umrahfi-next`;

-- Users table for customers, companies, and admins
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'company', 'admin') DEFAULT 'customer',
  `companyName` VARCHAR(255) NULL,
  `companyLicense` VARCHAR(255) NULL,
  `companyAddress` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Packages table for Umrah packages
CREATE TABLE `packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration` INT NOT NULL,
  `departureDate` DATE NOT NULL,
  `returnDate` DATE NOT NULL,
  `availableSeats` INT NOT NULL DEFAULT 0,
  `totalSeats` INT NOT NULL,
  `inclusions` JSON NULL,
  `exclusions` JSON NULL,
  `itinerary` JSON NULL,
  `hotelName` VARCHAR(255) NOT NULL,
  `hotelRating` INT DEFAULT 3,
  `mealPlan` ENUM('Breakfast', 'Half Board', 'Full Board', 'All Inclusive') DEFAULT 'Breakfast',
  `transportation` ENUM('Flight', 'Bus', 'Train', 'Private Car') DEFAULT 'Flight',
  `images` JSON NULL,
  `companyId` INT NOT NULL,
  `status` ENUM('active', 'inactive', 'soldout') DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`companyId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_packages_company` (`companyId`),
  INDEX `idx_packages_status` (`status`),
  INDEX `idx_packages_departure` (`departureDate`),
  INDEX `idx_packages_price` (`price`),
  INDEX `idx_packages_company_status` (`companyId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table for bookings
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customerId` INT NOT NULL,
  `packageId` INT NOT NULL,
  `companyId` INT NOT NULL,
  `orderNumber` VARCHAR(255) NOT NULL UNIQUE,
  `numberOfTravelers` INT NOT NULL DEFAULT 1,
  `travelers` JSON NOT NULL,
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `paymentStatus` ENUM('pending', 'partial', 'completed', 'refunded') DEFAULT 'pending',
  `paymentHistory` JSON NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  `specialRequests` TEXT NULL,
  `cancellationReason` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`companyId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_orders_customer` (`customerId`),
  INDEX `idx_orders_package` (`packageId`),
  INDEX `idx_orders_company` (`companyId`),
  INDEX `idx_orders_number` (`orderNumber`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_payment_status` (`paymentStatus`),
  INDEX `idx_orders_customer_status` (`customerId`, `status`),
  INDEX `idx_orders_company_status` (`companyId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;