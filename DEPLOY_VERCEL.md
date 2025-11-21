# Guide de Déploiement sur Vercel

## 🚀 Déploiement Rapide

### Option 1 : Via l'interface Vercel (Recommandé)

1. **Préparer le repository**
   ```bash
   # S'assurer que tout est commité
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Se connecter avec GitHub/GitLab/Bitbucket
   - Cliquer sur **"Add New Project"**
   - Importer votre repository `moro-your-financial-hub-1`

3. **Configurer le projet**
   - **Framework Preset** : Vite
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

4. **Configurer les variables d'environnement**
   Dans la section **Environment Variables**, ajouter :
   ```
   VITE_SUPABASE_URL=https://fydfrytvaqgeotdsewoi.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5ZGZyeXR2YXFnZW90ZHNld29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjA4NjIsImV4cCI6MjA3OTIzNjg2Mn0.bfF1pGCraL2Vy9KjgVhtre86V1it-P47F0w1EYfNL2k
   ```
   
   Optionnel (pour Wave) :
   ```
   VITE_WAVE_API_KEY=votre_clé_api_wave
   VITE_WAVE_MERCHANT_KEY=votre_clé_merchant_wave
   ```

5. **Déployer**
   - Cliquer sur **"Deploy"**
   - Attendre la fin du build
   - Votre application sera disponible sur `https://votre-projet.vercel.app`

### Option 2 : Via Vercel CLI

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   # Dans le répertoire du projet
   cd moro-your-financial-hub-1
   
   # Déploiement en production
   vercel --prod
   ```

4. **Configurer les variables d'environnement**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## ⚙️ Configuration Post-Déploiement

### 1. Configurer Supabase

1. **Aller dans Supabase Dashboard** → **Settings** → **API**
2. **Ajouter l'URL de Vercel dans les URLs autorisées** :
   - Aller dans **Authentication** → **URL Configuration**
   - Ajouter votre URL Vercel dans **Redirect URLs** :
     ```
     https://votre-projet.vercel.app
     https://votre-projet.vercel.app/**
     ```

### 2. Configurer le Storage Supabase

1. **Créer le bucket KYC** (si pas déjà fait) :
   - Supabase Dashboard → **Storage**
   - Créer le bucket `kyc-documents` (public)
   - Configurer les politiques RLS (voir `KYC_SETUP.md`)

### 3. Exécuter les migrations SQL

1. **Dans Supabase Dashboard** → **SQL Editor**
2. Exécuter dans l'ordre :
   - `001_initial_schema.sql`
   - `002_add_superadmin.sql`
   - `003_add_email_column.sql`
   - `004_add_kyc_system.sql`

## 🔍 Vérification Post-Déploiement

1. **Tester l'authentification**
   - Aller sur `https://votre-projet.vercel.app/login`
   - Tester la connexion par email

2. **Vérifier les routes**
   - `/` : Page d'accueil
   - `/login` : Page de connexion
   - `/dashboard` : Dashboard (après connexion)

3. **Vérifier les logs**
   - Dans Vercel Dashboard → **Deployments** → Cliquer sur le déploiement
   - Vérifier les logs pour les erreurs éventuelles

## 🐛 Dépannage

### Erreur de build

- Vérifier que toutes les dépendances sont dans `package.json`
- Vérifier que les variables d'environnement sont configurées
- Vérifier les logs de build dans Vercel

### Erreur CORS

- Vérifier que l'URL Vercel est ajoutée dans Supabase
- Vérifier les configurations CORS dans Supabase Dashboard

### Erreur d'authentification

- Vérifier les variables d'environnement Supabase
- Vérifier que l'URL de redirection est configurée dans Supabase

### Erreur de routing (404)

- Vercel devrait automatiquement gérer le routing SPA via `vercel.json`
- Vérifier que le fichier `vercel.json` est présent

## 📝 Variables d'Environnement Requises

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ Oui |
| `VITE_WAVE_API_KEY` | Clé API Wave (optionnel) | ❌ Non |
| `VITE_WAVE_MERCHANT_KEY` | Clé Merchant Wave (optionnel) | ❌ Non |

## 🔄 Mises à jour Futures

Pour mettre à jour l'application après un déploiement :

1. **Faire les modifications localement**
2. **Commit et push vers GitHub**
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin main
   ```
3. **Vercel déploiera automatiquement** (si GitHub est connecté)
   - Ou déclencher manuellement : `vercel --prod`

## 🌐 Domaines Personnalisés

Pour ajouter un domaine personnalisé :

1. **Dans Vercel Dashboard** → **Settings** → **Domains**
2. **Ajouter votre domaine**
3. **Suivre les instructions DNS**
4. **Mettre à jour Supabase** avec le nouveau domaine dans les URLs autorisées

## 📊 Monitoring

- **Vercel Analytics** : Activer dans Vercel Dashboard pour le suivi
- **Logs** : Disponibles dans Vercel Dashboard → **Deployments**
- **Performance** : Vercel fournit des métriques automatiques

## ✅ Checklist de Déploiement

- [ ] Repository Git créé et poussé
- [ ] Projet Vercel créé
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] URL Supabase configurée avec l'URL Vercel
- [ ] Migrations SQL exécutées
- [ ] Bucket Storage créé
- [ ] Test de connexion réussi
- [ ] Test des routes principales
- [ ] Domain personnalisé configuré (optionnel)

## 🎉 Félicitations !

Votre application MORO est maintenant déployée sur Vercel ! 🚀

