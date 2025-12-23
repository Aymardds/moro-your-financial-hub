-- Migration pour la gestion des utilisateurs d'organisation
-- Créée le: 2025-12-23

-- Table pour lier les utilisateurs aux organisations (coopératives et institutions)
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member', 'viewer'
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false, "manage_users": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_org_users_org ON organization_users(organization_id);
CREATE INDEX idx_org_users_user ON organization_users(user_id);
CREATE INDEX idx_org_users_role ON organization_users(role);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_organization_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER organization_users_updated_at
  BEFORE UPDATE ON organization_users
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_users_updated_at();

-- Ajouter une colonne pour marquer le premier utilisateur comme admin
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_organization_admin BOOLEAN DEFAULT false;

-- RLS (Row Level Security)
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy : Les admins d'organisation peuvent voir leurs utilisateurs
CREATE POLICY "Organization admins can view their users"
  ON organization_users FOR SELECT
  USING (
    -- L'utilisateur est admin de l'organisation
    organization_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_organization_admin = true
      AND role IN ('cooperative', 'institution')
    )
    -- Ou l'utilisateur consulte ses propres données
    OR user_id = auth.uid()
    -- Ou l'utilisateur est SuperAdmin/Admin
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superAdmin', 'admin')
    )
  );

-- Policy : Les admins d'organisation peuvent ajouter des utilisateurs
CREATE POLICY "Organization admins can insert users"
  ON organization_users FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_organization_admin = true
      AND role IN ('cooperative', 'institution')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superAdmin', 'admin')
    )
  );

-- Policy : Les admins d'organisation peuvent modifier leurs utilisateurs
CREATE POLICY "Organization admins can update their users"
  ON organization_users FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_organization_admin = true
      AND role IN ('cooperative', 'institution')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superAdmin', 'admin')
    )
  );

-- Policy : Les admins d'organisation peuvent supprimer leurs utilisateurs
CREATE POLICY "Organization admins can delete their users"
  ON organization_users FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_organization_admin = true
      AND role IN ('cooperative', 'institution')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superAdmin', 'admin')
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE organization_users IS 'Lie les utilisateurs aux organisations (coopératives et institutions financières)';
COMMENT ON COLUMN organization_users.role IS 'Rôle de l''utilisateur dans l''organisation: admin, member, viewer';
COMMENT ON COLUMN organization_users.permissions IS 'Permissions granulaires: read, write, delete, manage_users';
COMMENT ON COLUMN user_profiles.is_organization_admin IS 'Indique si l''utilisateur est administrateur de son organisation';
