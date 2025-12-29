-- Create Database
CREATE DATABASE SMART_MED_2;
USE SMART_MED_2;
DROP DATABASE SMART_MED_2;

-- Create Users table with role management
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('parent', 'child') NOT NULL DEFAULT 'parent',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Profiles table with enhanced profile management
CREATE TABLE profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    is_parent BOOLEAN DEFAULT false,
    profile_type ENUM('primary', 'family_member') NOT NULL DEFAULT 'primary',
    profile_status ENUM('active', 'archived') DEFAULT 'active',
    emergency_contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Family Relations table with enhanced relationship management
CREATE TABLE family_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_profile_id INT,
    child_profile_id INT,
    relation_type ENUM('biological', 'adopted', 'guardian') NOT NULL,
    relationship_type ENUM('father', 'mother', 'son', 'daughter') NOT NULL,
    is_primary_guardian BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (child_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT prevent_self_relation CHECK (parent_profile_id != child_profile_id),
    UNIQUE KEY unique_parent_child (parent_profile_id, child_profile_id)
);

-- Create Medical Documents table with enhanced document management
CREATE TABLE medical_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type ENUM('prescription', 'lab_report', 'discharge_summary', 'other') NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    processing_attempts INT DEFAULT 0,
    last_processed_at TIMESTAMP NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create Extracted Medicine Data table with enhanced medicine tracking
CREATE TABLE extracted_medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    extraction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score FLOAT,
    verified BOOLEAN DEFAULT false,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create Medicine Reference Dataset table
CREATE TABLE medicine_reference (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_name VARCHAR(255) UNIQUE NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    manufacturer VARCHAR(255),
    is_prescription_required BOOLEAN DEFAULT false,
    active_ingredients TEXT,
    contraindications TEXT,
    side_effects TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for optimized query performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_profile_user ON profiles(user_id);
CREATE INDEX idx_profile_type ON profiles(profile_type);
CREATE INDEX idx_family_parent ON family_relations(parent_profile_id);
CREATE INDEX idx_family_child ON family_relations(child_profile_id);
CREATE INDEX idx_family_relation_type ON family_relations(relation_type);
CREATE INDEX idx_document_profile ON medical_documents(profile_id);
CREATE INDEX idx_document_status ON medical_documents(processed_status);
CREATE INDEX idx_extracted_document ON extracted_medicines(document_id);
CREATE INDEX idx_medicine_name ON medicine_reference(medicine_name);

-- Add triggers for automatic timestamp updates
DELIMITER //

CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER before_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER before_relation_update
BEFORE UPDATE ON family_relations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- Add useful views for common queries
CREATE VIEW active_profiles AS
SELECT p.*, u.email, u.role
FROM profiles p
JOIN users u ON p.user_id = u.id
WHERE p.profile_status = 'active';

CREATE VIEW family_tree_view AS
SELECT 
    fr.id,
    p1.full_name as parent_name,
    p2.full_name as child_name,
    fr.relation_type,
    fr.relationship_type
FROM family_relations fr
JOIN profiles p1 ON fr.parent_profile_id = p1.id
JOIN profiles p2 ON fr.child_profile_id = p2.id;

DESCRIBE profiles;

ALTER TABLE family_relations 
MODIFY COLUMN relationship_type ENUM('father', 'mother', 'son', 'daughter', 'husband', 'wife') NOT NULL;

ALTER TABLE family_relations
ADD COLUMN is_spouse BOOLEAN DEFAULT FALSE;

ALTER TABLE family_relations 
MODIFY COLUMN relation_type ENUM('biological', 'adopted', 'guardian', 'spouse') NOT NULL;

ALTER TABLE profiles
ADD COLUMN diabetes_type ENUM('type1', 'type2', 'gestational', 'prediabetes', 'none') DEFAULT 'none',
ADD COLUMN height DECIMAL(5,2), -- Store height in cm
ADD COLUMN weight DECIMAL(5,2); -- Store weight in kg

ALTER TABLE users
ADD COLUMN theme ENUM('system', 'light', 'dark') DEFAULT 'system',
ADD COLUMN language VARCHAR(10) DEFAULT 'en',
ADD COLUMN push_notifications BOOLEAN DEFAULT true,
ADD COLUMN email_verified BOOLEAN DEFAULT false,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;

CREATE TABLE user_document_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    auto_ocr_enabled BOOLEAN DEFAULT true,
    compression_level INT DEFAULT 50,
    auto_categorization BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE family_sharing_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    auto_document_sharing BOOLEAN DEFAULT false,
    default_access_level ENUM('view_only', 'edit', 'full_access') DEFAULT 'view_only',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profile_diabetes ON profiles(diabetes_type);
CREATE INDEX idx_user_settings ON users(theme, language);
CREATE INDEX idx_document_settings_user ON user_document_settings(user_id);
CREATE INDEX idx_family_settings_user ON family_sharing_settings(user_id);


ALTER TABLE medical_documents
ADD COLUMN access_level ENUM('private', 'family', 'shared') DEFAULT 'private',
ADD COLUMN shared_with JSON DEFAULT NULL COMMENT 'Array of profile IDs with access',
ADD COLUMN owner_profile_id INT,
ADD CONSTRAINT fk_owner_profile FOREIGN KEY (owner_profile_id) REFERENCES profiles(id);

-- Update existing records
UPDATE medical_documents 
SET owner_profile_id = profile_id, 
    access_level = 'private' 
WHERE owner_profile_id IS NULL;

-- Add index for better query performance
CREATE INDEX idx_document_access ON medical_documents(access_level);
CREATE INDEX idx_document_owner ON medical_documents(owner_profile_id);

SELECT id, file_name, file_path, mime_type FROM medical_documents ORDER BY id DESC LIMIT 1;