# ✅ Checklist de Déploiement Vercel

## 📋 Avant le Déploiement

### 1. Préparation du Code
- [x] Build local réussi (`npm run build`)
- [ ] Code commité et poussé sur GitHub/GitLab
- [ ] Aucune erreur de linting
- [ ] Tests locaux effectués

### 2. Configuration Supabase
- [ ] Migrations SQL exécutées :
  - [ ] `001_initial_schema.sql`
  - [ ] `002_add_superadmin.sql`
  - [ ] `003_add_email_column.sql`
  - [ ] `004_add_kyc_system.sql`
- [ ] Bucket Storage `kyc-documents` créé
- [ ] Politiques RLS configurées
- [ ] Authentification par email activée
- [ ] Provider SMS configuré (optionnel)

### 3. Variables d'Environnement
- [ ] `VITE_SUPABASE_URL` : URL de votre projet Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- [ ] `VITE_WAVE_API_KEY` : (Optionnel) Clé API Wave
- [ ] `VITE_WAVE_MERCHANT_KEY` : (Optionnel) Clé Merchant Wave

## 🚀 Déploiement Vercel

### 4. Création du Projet Vercel
- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub/GitLab
- [ ] Framework détecté : Vite
- [ ] Configuration automatique validée

### 5. Configuration Vercel
- [ ] **Build Command** : `npm run build`
- [ ] **Output Directory** : `dist`
- [ ] **Install Command** : `npm install`
- [ ] Variables d'environnement ajoutées

### 6. Premier Déploiement
- [ ] Build réussi sans erreurs
- [ ] URL de déploiement obtenue
- [ ] Application accessible

## ⚙️ Configuration Post-Déploiement

### 7. Configuration Supabase pour Production
- [ ] URL Vercel ajoutée dans Supabase :
  - **Authentication** → **URL Configuration**
  - Ajouter dans **Redirect URLs** :
    ```
    https://votre-projet.vercel.app
    https://votre-projet.vercel.app/**
    ```
- [ ] Site URL mise à jour dans Supabase

### 8. Tests de Fonctionnalités
- [ ] Page d'accueil accessible
- [ ] Page de connexion fonctionnelle
- [ ] Authentification par email fonctionne
- [ ] Redirection vers dashboard après connexion
- [ ] Dashboard selon le rôle fonctionne
- [ ] Upload de documents KYC fonctionne (si applicable)

### 9. Sécurité
- [ ] Variables d'environnement non exposées dans le code
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Bucket Storage avec politiques correctes
- [ ] HTTPS activé (automatique sur Vercel)

## 🌐 Domain Personnalisé (Optionnel)

### 10. Configuration du Domaine
- [ ] Domaine acheté
- [ ] Domaine ajouté dans Vercel
- [ ] DNS configuré
- [ ] SSL activé automatiquement
- [ ] URL mise à jour dans Supabase

## 📊 Monitoring

### 11. Outils de Suivi
- [ ] Vercel Analytics activé (optionnel)
- [ ] Logs Vercel accessibles
- [ ] Monitoring des erreurs configuré

## ✅ Validation Finale

### 12. Tests Complets
- [ ] Connexion en tant qu'entrepreneur
- [ ] Connexion en tant qu'agent
- [ ] Connexion en tant que coopérative
- [ ] Connexion en tant qu'institution
- [ ] Connexion en tant que super admin
- [ ] Création d'une opération
- [ ] Création d'un projet
- [ ] Soumission d'une demande KYC
- [ ] Validation KYC (si applicable)
- [ ] Demande de financement

## 🎉 Déploiement Réussi !

Une fois toutes les cases cochées, votre application est prête pour la production ! 🚀

