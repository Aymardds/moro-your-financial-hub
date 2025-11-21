-- Migration pour ajouter la colonne email à user_profiles
-- Cette migration ajoute la colonne email si elle n'existe pas déjà

-- Ajouter la colonne email si elle n'existe pas
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

-- Créer un index sur email pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Mettre à jour les emails depuis auth.users (si possible)
-- Note: Cette requête nécessite des permissions spéciales
-- Vous pouvez l'exécuter manuellement depuis le Supabase Dashboard si nécessaire

