-- ============================================================================
-- MORO Financial Hub - Database Tables Migration
-- ============================================================================
-- Execute this FIRST in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  name TEXT,
  role TEXT CHECK (role IN ('entrepreneur', 'agent', 'cooperative', 'institution', 'superAdmin')) DEFAULT 'entrepreneur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des opérations financières
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'épargne
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) DEFAULT 0,
  target DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  frequency TEXT CHECK (frequency IN ('monthly', 'yearly')) NOT NULL,
  wave_subscription_id TEXT,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients des agents
CREATE TABLE IF NOT EXISTS agent_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);

-- Table des transactions des agents
CREATE TABLE IF NOT EXISTS agent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres de coopérative
CREATE TABLE IF NOT EXISTS cooperative_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cooperative_id, user_id)
);

-- Table des prêts de coopérative
CREATE TABLE IF NOT EXISTS cooperative_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'repaid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes de financement
CREATE TABLE IF NOT EXISTS financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  identity_document_url TEXT,
  business_registration_url TEXT,
  tax_certificate_url TEXT,
  proof_of_address_url TEXT,
  
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
  reviewed_by UUID REFERENCES auth.users(id),
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
CREATE INDEX IF NOT EXISTS idx_operations_user_id ON operations(user_id);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_members_cooperative_id ON cooperative_members(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_loans_cooperative_id ON cooperative_loans(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_financing_applications_entrepreneur_id ON financing_applications(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_financing_applications_institution_id ON financing_applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_financing_applications_status ON financing_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_kyc_validations_user_id ON kyc_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_validations_status ON kyc_validations(status);
CREATE INDEX IF NOT EXISTS idx_kyc_validations_entity_type ON kyc_validations(entity_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_kyc_id ON kyc_documents(kyc_validation_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_updated_at ON savings;
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cooperative_loans_updated_at ON cooperative_loans;
CREATE TRIGGER update_cooperative_loans_updated_at BEFORE UPDATE ON cooperative_loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financing_applications_updated_at ON financing_applications;
CREATE TRIGGER update_financing_applications_updated_at BEFORE UPDATE ON financing_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyc_validations_updated_at ON kyc_validations;
CREATE TRIGGER update_kyc_validations_updated_at BEFORE UPDATE ON kyc_validations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques RLS pour operations
DROP POLICY IF EXISTS "Users can view their own operations" ON operations;
CREATE POLICY "Users can view their own operations" ON operations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own operations" ON operations;
CREATE POLICY "Users can insert their own operations" ON operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own operations" ON operations;
CREATE POLICY "Users can update their own operations" ON operations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own operations" ON operations;
CREATE POLICY "Users can delete their own operations" ON operations
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour savings
DROP POLICY IF EXISTS "Users can view their own savings" ON savings;
CREATE POLICY "Users can view their own savings" ON savings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own savings" ON savings;
CREATE POLICY "Users can insert their own savings" ON savings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own savings" ON savings;
CREATE POLICY "Users can update their own savings" ON savings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own savings" ON savings;
CREATE POLICY "Users can delete their own savings" ON savings
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour agent_clients
DROP POLICY IF EXISTS "Agents can view their clients" ON agent_clients;
CREATE POLICY "Agents can view their clients" ON agent_clients
  FOR SELECT USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can insert their clients" ON agent_clients;
CREATE POLICY "Agents can insert their clients" ON agent_clients
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Politiques RLS pour agent_transactions
DROP POLICY IF EXISTS "Agents can view their transactions" ON agent_transactions;
CREATE POLICY "Agents can view their transactions" ON agent_transactions
  FOR SELECT USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agents can insert their transactions" ON agent_transactions;
CREATE POLICY "Agents can insert their transactions" ON agent_transactions
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Politiques RLS pour cooperative_members
DROP POLICY IF EXISTS "Cooperatives can view their members" ON cooperative_members;
CREATE POLICY "Cooperatives can view their members" ON cooperative_members
  FOR SELECT USING (auth.uid() = cooperative_id);

DROP POLICY IF EXISTS "Cooperatives can insert their members" ON cooperative_members;
CREATE POLICY "Cooperatives can insert their members" ON cooperative_members
  FOR INSERT WITH CHECK (auth.uid() = cooperative_id);

-- Politiques RLS pour cooperative_loans
DROP POLICY IF EXISTS "Cooperatives can view their loans" ON cooperative_loans;
CREATE POLICY "Cooperatives can view their loans" ON cooperative_loans
  FOR SELECT USING (auth.uid() = cooperative_id);

DROP POLICY IF EXISTS "Cooperatives can insert their loans" ON cooperative_loans;
CREATE POLICY "Cooperatives can insert their loans" ON cooperative_loans
  FOR INSERT WITH CHECK (auth.uid() = cooperative_id);

DROP POLICY IF EXISTS "Cooperatives can update their loans" ON cooperative_loans;
CREATE POLICY "Cooperatives can update their loans" ON cooperative_loans
  FOR UPDATE USING (auth.uid() = cooperative_id);

-- Politiques RLS pour financing_applications
DROP POLICY IF EXISTS "Entrepreneurs can view their applications" ON financing_applications;
CREATE POLICY "Entrepreneurs can view their applications" ON financing_applications
  FOR SELECT USING (auth.uid() = entrepreneur_id);

DROP POLICY IF EXISTS "Entrepreneurs can insert their applications" ON financing_applications;
CREATE POLICY "Entrepreneurs can insert their applications" ON financing_applications
  FOR INSERT WITH CHECK (auth.uid() = entrepreneur_id);

DROP POLICY IF EXISTS "Institutions can view applications" ON financing_applications;
CREATE POLICY "Institutions can view applications" ON financing_applications
  FOR SELECT USING (auth.uid() = institution_id);

DROP POLICY IF EXISTS "Institutions can update applications" ON financing_applications;
CREATE POLICY "Institutions can update applications" ON financing_applications
  FOR UPDATE USING (auth.uid() = institution_id);

-- Politiques RLS pour kyc_validations
DROP POLICY IF EXISTS "Users can view their own KYC" ON kyc_validations;
CREATE POLICY "Users can view their own KYC" ON kyc_validations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own KYC" ON kyc_validations;
CREATE POLICY "Users can insert their own KYC" ON kyc_validations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own KYC" ON kyc_validations;
CREATE POLICY "Users can update their own KYC" ON kyc_validations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can view all KYC" ON kyc_validations;
CREATE POLICY "Super admins can view all KYC" ON kyc_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update all KYC" ON kyc_validations;
CREATE POLICY "Super admins can update all KYC" ON kyc_validations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

DROP POLICY IF EXISTS "Institutions can view entrepreneur KYC" ON kyc_validations;
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
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON kyc_documents;
CREATE POLICY "Users can view their own KYC documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kyc_validations kv
      WHERE kv.id = kyc_documents.kyc_validation_id
      AND kv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON kyc_documents;
CREATE POLICY "Users can insert their own KYC documents" ON kyc_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kyc_validations kv
      WHERE kv.id = kyc_documents.kyc_validation_id
      AND kv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can view all KYC documents" ON kyc_documents;
CREATE POLICY "Super admins can view all KYC documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );
