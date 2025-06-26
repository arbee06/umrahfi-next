-- Add only the missing columns to users table
-- (resetToken and resetTokenExpiry already exist)

-- Add banking information columns
ALTER TABLE `users` ADD COLUMN `bankName` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN `bankAccountNumber` VARCHAR(100) NULL;
ALTER TABLE `users` ADD COLUMN `bankAccountHolderName` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN `bankRoutingNumber` VARCHAR(50) NULL;
ALTER TABLE `users` ADD COLUMN `bankSwiftCode` VARCHAR(20) NULL;
ALTER TABLE `users` ADD COLUMN `bankAddress` TEXT NULL;

-- Add profile picture column
ALTER TABLE `users` ADD COLUMN `profilePicture` VARCHAR(255) NULL;