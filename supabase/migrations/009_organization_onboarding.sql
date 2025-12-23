-- Create enum for onboarding status
CREATE TYPE onboarding_status AS ENUM (
    'incomplete', 
    'pending_approval', 
    'awaiting_docs', 
    'pending_verification', 
    'active'
);

-- Add onboarding_status to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN onboarding_status onboarding_status DEFAULT 'incomplete';

-- Create enum for application status
CREATE TYPE application_status AS ENUM (
    'draft', 
    'submitted', 
    'approved', 
    'rejected'
);

-- Create organization_applications table
CREATE TABLE organization_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('cooperative', 'institution')),
    basic_info JSONB DEFAULT '{}'::jsonb,
    membership_info JSONB DEFAULT '{}'::jsonb,
    management_info JSONB DEFAULT '{}'::jsonb,
    status application_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for document types
CREATE TYPE org_document_type AS ENUM (
    'agrement', 
    'location_plan', 
    'id_president', 
    'id_secretary', 
    'contract'
);

-- Create enum for document status
CREATE TYPE document_status AS ENUM (
    'pending', 
    'verified', 
    'rejected'
);

-- Create organization_documents table
CREATE TABLE organization_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES organization_applications(id) NOT NULL,
    document_type org_document_type NOT NULL,
    file_url TEXT NOT NULL,
    status document_status DEFAULT 'pending',
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- Organization Applications
ALTER TABLE organization_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own application" 
ON organization_applications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own application" 
ON organization_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own application" 
ON organization_applications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" 
ON organization_applications FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superAdmin')
    )
);

-- Organization Documents
ALTER TABLE organization_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" 
ON organization_documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM organization_applications
        WHERE id = organization_documents.application_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own documents" 
ON organization_documents FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_applications
        WHERE id = organization_documents.application_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own documents" 
ON organization_documents FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM organization_applications
        WHERE id = organization_documents.application_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all documents" 
ON organization_documents FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superAdmin')
    )
);
