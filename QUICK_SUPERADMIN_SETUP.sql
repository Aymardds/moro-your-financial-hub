-- Script rapide pour créer un Super Admin
-- Remplacez 'VOTRE-USER-ID' par votre User ID depuis Supabase Dashboard → Authentication → Users

-- Étape 1 : Ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Étape 2 : Mettre à jour la contrainte pour inclure superAdmin
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('entrepreneur', 'agent', 'cooperative', 'institution', 'superAdmin'));

-- Étape 3 : Mettre à jour votre profil (REMPLACEZ 'VOTRE-USER-ID' par votre vrai User ID)
-- Pour trouver votre User ID : Supabase Dashboard → Authentication → Users → Copier l'UID

UPDATE user_profiles 
SET role = 'superAdmin', email = 'dstephaneaymard@gmail.com'
WHERE id = 'VOTRE-USER-ID';

-- Si le profil n'existe pas encore, créer :
INSERT INTO user_profiles (id, email, role, name) 
VALUES (
  'VOTRE-USER-ID',
  'dstephaneaymard@gmail.com',
  'superAdmin',
  'Super Administrateur'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'superAdmin', 
    email = 'dstephaneaymard@gmail.com',
    name = COALESCE(user_profiles.name, 'Super Administrateur');

-- Vérification
SELECT id, email, role, name, created_at 
FROM user_profiles 
WHERE email = 'dstephaneaymard@gmail.com' OR role = 'superAdmin';

