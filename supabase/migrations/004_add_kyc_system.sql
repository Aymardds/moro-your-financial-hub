-- Migration pour ajouter le système de validation KYC
-- KYC (Know Your Customer) pour entrepreneurs, coopératives et institutions

-- Table des validations KYC
CREATE TABLE IF NOT EXISTS kyc_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('entrepreneur', 'cooperative', 'institution')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Informations personnelles/entreprise
  full_name TEXT,
  business_name TEXT,
  registration_number TEXT,
  tax_id TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Documents
  identity_document_url TEXT, -- Carte d'identité, passeport
  business_registration_url TEXT, -- Document d'enregistrement
  tax_certificate_url TEXT, -- Certificat fiscal
  proof_of_address_url TEXT, -- Justificatif de domicile
  
  -- Informations financières
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  
  -- Informations de contact
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Métadonnées
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id), -- Super Admin ou Institution qui a validé
  rejection_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents KYC
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_validation_id UUID REFERENCES kyc_validations(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN (
    'identity', 
    'business_registration', 
    'tax_certificate', 
    'proof_of_address',
    'bank_statement',
    'other'
  )) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_kyc_validations_user_id ON kyc_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_validations_status ON kyc_validations(status);
CREATE INDEX IF NOT EXISTS idx_kyc_validations_entity_type ON kyc_validations(entity_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_kyc_id ON kyc_documents(kyc_validation_id);

-- RLS (Row Level Security)
ALTER TABLE kyc_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour kyc_validations
-- Les utilisateurs peuvent voir et modifier leur propre KYC
CREATE POLICY "Users can view their own KYC" ON kyc_validations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC" ON kyc_validations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC" ON kyc_validations
  FOR UPDATE USING (auth.uid() = user_id);

-- Les super admins et institutions peuvent voir tous les KYC
CREATE POLICY "Super admins can view all KYC" ON kyc_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

CREATE POLICY "Super admins can update all KYC" ON kyc_validations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

-- Les institutions peuvent voir les KYC des entrepreneurs qui leur ont soumis des demandes
CREATE POLICY "Institutions can view entrepreneur KYC" ON kyc_validations
  FOR SELECT USING (
    entity_type = 'entrepreneur' AND
    EXISTS (
      SELECT 1 FROM financing_applications fa
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE fa.entrepreneur_id = kyc_validations.user_id
      AND fa.institution_id = auth.uid()
      AND up.role = 'institution'
    )
  );

-- Politiques RLS pour kyc_documents
CREATE POLICY "Users can view their own KYC documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kyc_validations kv
      WHERE kv.id = kyc_documents.kyc_validation_id
      AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own KYC documents" ON kyc_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kyc_validations kv
      WHERE kv.id = kyc_documents.kyc_validation_id
      AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all KYC documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_kyc_validations_updated_at BEFORE UPDATE ON kyc_validations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

