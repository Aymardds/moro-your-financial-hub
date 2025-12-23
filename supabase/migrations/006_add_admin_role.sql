-- ============================================================================
-- Migration: Add Admin Role and Role Management
-- ============================================================================
-- Execute this in Supabase SQL Editor after the initial setup
-- ============================================================================

-- 1. Ajouter le rôle 'admin' à la contrainte de rôle
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('entrepreneur', 'agent', 'cooperative', 'institution', 'admin', 'superAdmin'));

-- 2. Créer la table d'historique des changements de rôles
CREATE TABLE IF NOT EXISTS role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_role_changes_user_id ON role_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_by ON role_changes(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON role_changes(created_at DESC);

-- Activer RLS
ALTER TABLE role_changes ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour role_changes
DROP POLICY IF EXISTS "SuperAdmins can view all role changes" ON role_changes;
CREATE POLICY "SuperAdmins can view all role changes" ON role_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

DROP POLICY IF EXISTS "SuperAdmins can insert role changes" ON role_changes;
CREATE POLICY "SuperAdmins can insert role changes" ON role_changes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

DROP POLICY IF EXISTS "Admins can view role changes" ON role_changes;
CREATE POLICY "Admins can view role changes" ON role_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Politiques RLS pour admins sur user_profiles
-- Les admins peuvent voir tous les profils sauf superAdmin
DROP POLICY IF EXISTS "Admins can view non-superadmin profiles" ON user_profiles;
CREATE POLICY "Admins can view non-superadmin profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    ) AND role != 'superAdmin'
  );

-- Les admins peuvent modifier certains profils (pas superAdmin ni admin)
DROP POLICY IF EXISTS "Admins can update certain profiles" ON user_profiles;
CREATE POLICY "Admins can update certain profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    ) AND role IN ('cooperative', 'institution', 'entrepreneur', 'agent')
  );

-- 5. Politiques pour SuperAdmin - voir TOUS les profils
DROP POLICY IF EXISTS "SuperAdmins can view all profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

-- SuperAdmins peuvent modifier tous les profils
DROP POLICY IF EXISTS "SuperAdmins can update all profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

-- SuperAdmins peuvent supprimer des profils
DROP POLICY IF EXISTS "SuperAdmins can delete profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can delete profiles" ON user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'superAdmin'
    )
  );

-- 6. Fonction pour enregistrer les changements de rôle
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO role_changes (user_id, old_role, new_role, changed_by)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour enregistrer automatiquement les changements de rôle
DROP TRIGGER IF EXISTS log_role_change_trigger ON user_profiles;
CREATE TRIGGER log_role_change_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- ============================================================================
-- Migration Complete!
-- ============================================================================
