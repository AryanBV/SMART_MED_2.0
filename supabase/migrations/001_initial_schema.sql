-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table with role management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'child')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
    language VARCHAR(10) DEFAULT 'en',
    push_notifications BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Profiles table with enhanced profile management
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    diabetes_type VARCHAR(20) DEFAULT 'none' CHECK (diabetes_type IN ('type1', 'type2', 'gestational', 'prediabetes', 'none')),
    height DECIMAL(5,2), -- Store height in cm
    weight DECIMAL(5,2), -- Store weight in kg
    is_parent BOOLEAN DEFAULT false,
    profile_type VARCHAR(20) NOT NULL DEFAULT 'primary' CHECK (profile_type IN ('primary', 'family_member')),
    profile_status VARCHAR(20) DEFAULT 'active' CHECK (profile_status IN ('active', 'archived')),
    emergency_contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Family Relations table with enhanced relationship management
CREATE TABLE IF NOT EXISTS family_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('biological', 'adopted', 'guardian', 'spouse')),
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('father', 'mother', 'son', 'daughter', 'husband', 'wife')),
    is_primary_guardian BOOLEAN DEFAULT false,
    is_spouse BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT prevent_self_relation CHECK (parent_profile_id != child_profile_id),
    UNIQUE(parent_profile_id, child_profile_id)
);

-- Create Medical Documents table with enhanced document management
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('prescription', 'lab_report', 'discharge_summary', 'other')),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_status VARCHAR(20) DEFAULT 'pending' CHECK (processed_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_attempts INTEGER DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Extracted Medicine Data table with enhanced medicine tracking
CREATE TABLE IF NOT EXISTS extracted_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    extraction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score FLOAT,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Medicine Reference Dataset table
CREATE TABLE IF NOT EXISTS medicine_reference (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Document Settings table
CREATE TABLE IF NOT EXISTS user_document_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    auto_ocr_enabled BOOLEAN DEFAULT true,
    compression_level INTEGER DEFAULT 50,
    auto_categorization BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for optimized query performance
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_profile_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_family_parent ON family_relations(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_child ON family_relations(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_relation_type ON family_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_document_profile ON medical_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_document_status ON medical_documents(processed_status);
CREATE INDEX IF NOT EXISTS idx_extracted_document ON extracted_medicines(document_id);
CREATE INDEX IF NOT EXISTS idx_medicine_name ON medicine_reference(medicine_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_relations_updated_at BEFORE UPDATE ON family_relations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_documents_updated_at BEFORE UPDATE ON medical_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extracted_medicines_updated_at BEFORE UPDATE ON extracted_medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_reference_updated_at BEFORE UPDATE ON medicine_reference
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_document_settings_updated_at BEFORE UPDATE ON user_document_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_profiles AS
SELECT p.*, u.email, u.role
FROM profiles p
JOIN users u ON p.user_id = u.id
WHERE p.profile_status = 'active';

CREATE OR REPLACE VIEW family_tree_view AS
SELECT 
    fr.id,
    p1.full_name as parent_name,
    p2.full_name as child_name,
    fr.relation_type,
    fr.relationship_type
FROM family_relations fr
JOIN profiles p1 ON fr.parent_profile_id = p1.id
JOIN profiles p2 ON fr.child_profile_id = p2.id;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_document_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Profiles: Users can see their own profiles and family members
CREATE POLICY "Users can view their profiles" ON profiles
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM family_relations fr
            WHERE (fr.parent_profile_id = profiles.id OR fr.child_profile_id = profiles.id)
            AND EXISTS (
                SELECT 1 FROM profiles p2
                WHERE p2.id IN (fr.parent_profile_id, fr.child_profile_id)
                AND p2.user_id = auth.uid()
            )
        )
    );

-- Medical documents: Users can only see documents for their profiles
CREATE POLICY "Users can manage their documents" ON medical_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = medical_documents.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
