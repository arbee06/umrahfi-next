-- Add company verification fields
ALTER TABLE users 
ADD COLUMN isVerified BOOLEAN DEFAULT FALSE,
ADD COLUMN verificationStatus ENUM('pending', 'approved', 'rejected', 'not_submitted') DEFAULT 'not_submitted',
ADD COLUMN verificationDate DATETIME NULL,
ADD COLUMN verifiedBy INT NULL,
ADD COLUMN verificationNotes TEXT NULL,
ADD COLUMN rejectionReason TEXT NULL,
ADD CONSTRAINT fk_verified_by FOREIGN KEY (verifiedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Create company documents table
CREATE TABLE IF NOT EXISTS company_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    documentType ENUM('license', 'registration', 'insurance', 'other') NOT NULL,
    documentName VARCHAR(255) NOT NULL,
    documentPath VARCHAR(500) NOT NULL,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    isActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_documents (userId),
    INDEX idx_document_type (documentType)
);

-- Add indexes for better query performance
CREATE INDEX idx_verification_status ON users(verificationStatus);
CREATE INDEX idx_is_verified ON users(isVerified);