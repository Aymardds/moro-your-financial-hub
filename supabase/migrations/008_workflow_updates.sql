-- Migration 008: Mises à jour du Workflow, KYC Membre et Scoring
-- Objectif : Supporter la validation des organisations, le KYC membre avancé (GPS, Matricule), 
-- et le flux de financement à 3 niveaux.

-- 1. Ajout du statut pour les profils utilisateurs (Validation Organisation)
-- Permet de mettre les organisations en attente de validation par l'Admin Moro
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'active', 'rejected', 'suspended')) DEFAULT 'pending';

-- Mettre à jour les utilisateurs existants pour qu'ils soient actifs par défaut (pour ne pas bloquer l'existant)
UPDATE user_profiles SET status = 'active' WHERE status IS NULL;

-- 2. Amélioration de la table KYC Validations pour les Membres
-- Ajout des champs pour la géolocalisation et l'identification unique interne
ALTER TABLE kyc_validations
ADD COLUMN IF NOT EXISTS matricule TEXT,
ADD COLUMN IF NOT EXISTS gps_coordinates TEXT, -- Format "lat,long"
ADD COLUMN IF NOT EXISTS photo_id_url TEXT; -- Photo d'identité spécifique si différente du document

-- 3. Mise à jour du Workflow de Financement
-- Modification de la contrainte CHECK sur le status pour supporter le flux à 3 niveaux
-- Flux : pending -> submitted_to_coop -> approved_by_coop -> submitted_to_admin -> approved_by_admin -> submitted_to_institution -> approved/rejected

-- D'abord, on supprime l'ancienne contrainte
ALTER TABLE financing_applications DROP CONSTRAINT IF EXISTS financing_applications_status_check;

-- Ensuite, on ajoute la nouvelle contrainte étendue
ALTER TABLE financing_applications 
ADD CONSTRAINT financing_applications_status_check 
CHECK (status IN (
  'pending', 
  'submitted_to_coop', 
  'approved_by_coop', 
  'rejected_by_coop',
  'submitted_to_admin', 
  'approved_by_admin', 
  'rejected_by_admin',
  'submitted_to_institution', 
  'approved', 
  'rejected'
));

-- 4. Ajout du Scoring IA
ALTER TABLE financing_applications
ADD COLUMN IF NOT EXISTS ai_score JSONB; -- Stockera { "score": 750, "factors": [...], "risk_level": "low" }

-- 5. Index pour les recherches géographiques (Optionnel mais recommandé pour le futur)
-- CREATE INDEX IF NOT EXISTS idx_kyc_gps ON kyc_validations USING GIST (ll_to_earth(split_part(gps_coordinates, ',', 1)::float8, split_part(gps_coordinates, ',', 2)::float8));
-- Note: Nécessite l'extension postgis ou cube/earthdistance, on reste sur du text simple pour l'instant.

-- 6. Politiques RLS mises à jour (Si nécessaire)
-- Les Admins Moro doivent pouvoir voir toutes les demandes soumises à eux
CREATE POLICY "Admins can view applications submitted to them" ON financing_applications
  FOR SELECT USING (
    (status IN ('submitted_to_admin', 'approved_by_admin', 'submitted_to_institution', 'approved', 'rejected')) AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('superAdmin', 'admin'))
  );

-- Les Coopératives doivent voir les demandes de LEURS membres
CREATE POLICY "Cooperatives can view member applications" ON financing_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cooperative_members cm
      WHERE cm.cooperative_id = auth.uid()
      AND cm.user_id = financing_applications.entrepreneur_id
    )
  );

-- Permettre aux coopératives de mettre à jour le status des demandes de leurs membres
CREATE POLICY "Cooperatives can update member applications" ON financing_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cooperative_members cm
      WHERE cm.cooperative_id = auth.uid()
      AND cm.user_id = financing_applications.entrepreneur_id
    )
  );
