# Configuration du Système KYC

## 📋 Vue d'ensemble

Le système KYC (Know Your Customer) permet de valider l'identité et les documents des :
- **Entrepreneurs** : pour accéder aux demandes de financement
- **Coopératives** : pour valider leur statut légal
- **Institutions financières** : pour vérifier leur enregistrement

## 🗄️ Configuration de la Base de Données

### 1. Exécuter les migrations SQL

Exécutez dans l'ordre dans Supabase SQL Editor :

1. `001_initial_schema.sql` (si pas déjà fait)
2. `002_add_superadmin.sql` (si pas déjà fait)
3. `003_add_email_column.sql` (si pas déjà fait)
4. `004_add_kyc_system.sql` (NOUVEAU - système KYC)

### 2. Créer le bucket de stockage Supabase

1. Aller dans **Supabase Dashboard** → **Storage**
2. Cliquer sur **New bucket**
3. Nom : `kyc-documents`
4. **Public bucket** : ACTIVÉ (public avec RLS strict)
   - Note: Les politiques RLS garantiront que seuls les utilisateurs autorisés peuvent accéder
5. Cliquer sur **Create bucket**

### 3. Configurer les politiques de stockage

Dans **Storage** → **Policies** pour le bucket `kyc-documents` :

```sql
-- Politique : Les utilisateurs peuvent uploader leurs propres documents
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique : Les utilisateurs peuvent lire leurs propres documents
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique : Les super admins peuvent lire tous les documents
CREATE POLICY "Super admins can read all KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'superAdmin'
  )
);

-- Politique : Les utilisateurs peuvent lire leurs propres documents
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique : Les institutions peuvent lire les documents des entrepreneurs
CREATE POLICY "Institutions can read entrepreneur KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM kyc_validations kv
    JOIN financing_applications fa ON fa.entrepreneur_id = kv.user_id
    JOIN user_profiles up ON up.id = auth.uid()
    WHERE kv.user_id::text = (storage.foldername(name))[1]
    AND fa.institution_id = auth.uid()
    AND up.role = 'institution'
  )
);
```

## 🎯 Utilisation

### Pour les Entrepreneurs

1. Se connecter au dashboard
2. Une alerte KYC apparaît si non validé
3. Cliquer sur "Commencer la validation KYC"
4. Remplir le formulaire avec :
   - Informations personnelles
   - Adresse
   - Informations bancaires
   - Documents (pièce d'identité, justificatif de domicile, etc.)
5. Soumettre la demande
6. Attendre la validation par une institution ou un super admin

### Pour les Institutions Financières

1. Se connecter au dashboard institution
2. Aller dans l'onglet **"Validations KYC"**
3. Voir toutes les validations KYC des entrepreneurs
4. Examiner les documents
5. Approuver ou rejeter avec une raison

### Pour les Coopératives

1. Se connecter au dashboard coopérative
2. Aller dans l'onglet **"Validations KYC"**
3. Voir les validations KYC des membres
4. Valider les documents des membres

## 📝 Statuts KYC

- **pending** : En attente de traitement
- **in_review** : En cours d'examen
- **approved** : Approuvé
- **rejected** : Rejeté (avec raison)

## 🔐 Sécurité

- Les documents sont stockés de manière privée
- Seuls les propriétaires, super admins et institutions concernées peuvent voir les documents
- Row Level Security (RLS) activé sur toutes les tables
- Validation des fichiers (images et PDF uniquement)

## ⚠️ Notes Importantes

1. **Taille des fichiers** : Limitez à 10MB par fichier
2. **Formats acceptés** : Images (JPG, PNG) et PDF
3. **Validation** : Les institutions doivent valider avant d'approuver les financements
4. **Documents requis** :
   - Entrepreneurs : Pièce d'identité, justificatif de domicile
   - Coopératives/Institutions : Document d'enregistrement, certificat fiscal, justificatif de domicile

## 🚀 Prochaines Étapes

- [ ] Ajouter la vérification automatique des documents (OCR)
- [ ] Intégrer des services de vérification d'identité tiers
- [ ] Ajouter des notifications pour les changements de statut KYC
- [ ] Créer un système de renouvellement périodique des validations

