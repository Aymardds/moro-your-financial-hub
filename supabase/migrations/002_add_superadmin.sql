-- Migration pour ajouter le support du rôle superAdmin
-- Cette migration met à jour la contrainte CHECK pour inclure 'superAdmin'

-- Supprimer l'ancienne contrainte
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Ajouter la nouvelle contrainte avec superAdmin
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('entrepreneur', 'agent', 'cooperative', 'institution', 'superAdmin'));

-- Ajouter la colonne email si elle n'existe pas déjà
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Créer un index sur le rôle pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Exemple : Créer un utilisateur superAdmin (à adapter avec votre email)
-- INSERT INTO user_profiles (id, email, role) 
-- VALUES ('votre-user-id-ici', 'admin@moro.com', 'superAdmin')
-- ON CONFLICT (id) DO UPDATE SET role = 'superAdmin';

