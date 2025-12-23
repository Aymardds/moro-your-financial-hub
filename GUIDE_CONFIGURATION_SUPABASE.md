# 🚀 Guide de Configuration Supabase pour MORO

## ✅ Étape 1 : Connexion à Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous avec :
   - **GitHub** (recommandé) OU
   - **Google** OU
   - **Email** (lien magique)

## ✅ Étape 2 : Créer un Nouveau Projet

Une fois connecté :

1. Cliquez sur **"New Project"** ou **"Nouveau Projet"**
2. Remplissez les informations :
   - **Name** : `moro-financial-hub` (ou le nom de votre choix)
   - **Database Password** : Créez un mot de passe fort (NOTEZ-LE !)
   - **Region** : Choisissez la région la plus proche (ex: `eu-west-1` pour l'Europe)
   - **Pricing Plan** : Sélectionnez **Free** pour commencer
3. Cliquez sur **"Create new project"**
4. ⏳ Attendez 2-3 minutes que le projet soit créé

## ✅ Étape 3 : Récupérer les Clés API

Une fois le projet créé :

1. Dans le menu de gauche, allez dans **Settings** (⚙️) → **API**
2. Vous verrez deux sections importantes :

### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
📋 **Copiez cette URL**

### **API Keys**
Vous verrez deux clés :
- **anon/public** : C'est celle-ci qu'il faut copier
- **service_role** : NE PAS UTILISER côté client (secret)

📋 **Copiez la clé `anon public`**

## ✅ Étape 4 : Configurer le fichier .env

1. Ouvrez le fichier `.env` à la racine du projet
2. Remplacez les valeurs par vos vraies clés :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...

# Backend URL (optionnel pour Wave)
VITE_BACKEND_URL=

# Wave Mobile Money (optionnel)
WAVE_API_URL=https://api.wave.com/v1
WAVE_API_KEY=
WAVE_MERCHANT_KEY=
```

3. **Sauvegardez le fichier**

## ✅ Étape 5 : Exécuter les Migrations SQL

Maintenant, nous devons créer les tables dans la base de données :

### **5.1 Ouvrir l'éditeur SQL**
1. Dans Supabase Dashboard, allez dans **SQL Editor** (icône 📝)
2. Cliquez sur **"New query"**

### **5.2 Exécuter les migrations dans l'ordre**

#### **Migration 1 : Schéma Initial**
1. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql`
2. Copiez TOUT le contenu
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** ou **"Exécuter"**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

#### **Migration 2 : Super Admin**
1. Ouvrez le fichier `supabase/migrations/002_add_superadmin.sql`
2. Copiez le contenu
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

#### **Migration 3 : Colonne Email**
1. Ouvrez le fichier `supabase/migrations/003_add_email_column.sql`
2. Copiez le contenu
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

#### **Migration 4 : Système KYC**
1. Ouvrez le fichier `supabase/migrations/004_add_kyc_system.sql`
2. Copiez le contenu
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

#### **Migration 5 : Sécurité KYC Bucket**
1. Ouvrez le fichier `supabase/migrations/005_secure_kyc_bucket.sql`
2. Copiez le contenu
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

### **5.3 Vérifier les tables**
1. Allez dans **Table Editor** (icône 📊)
2. Vous devriez voir toutes les tables :
   - `user_profiles`
   - `operations`
   - `projects`
   - `savings`
   - `subscriptions`
   - `agent_clients`
   - `agent_transactions`
   - `cooperative_members`
   - `cooperative_loans`
   - `financing_applications`
   - `kyc_documents`

## ✅ Étape 6 : Configurer l'Authentification

### **6.1 Activer l'authentification par Email**
1. Allez dans **Authentication** → **Providers**
2. Cherchez **Email**
3. Activez **"Enable Email provider"**
4. Activez **"Confirm email"** (optionnel)
5. Cliquez sur **"Save"**

### **6.2 Configurer l'authentification par Téléphone (Optionnel)**

⚠️ **Important** : L'authentification par téléphone nécessite un provider SMS (Twilio, MessageBird, ou Vonage)

#### **Option A : Twilio (Recommandé)**
1. Créez un compte sur [twilio.com](https://www.twilio.com)
2. Obtenez vos identifiants :
   - Account SID
   - Auth Token
   - Numéro de téléphone Twilio
3. Dans Supabase :
   - Allez dans **Authentication** → **Providers** → **Phone**
   - Activez **"Enable Phone provider"**
   - Sélectionnez **Twilio**
   - Entrez vos identifiants
   - Cliquez sur **"Save"**

#### **Option B : Utiliser Email pour les tests**
Si vous ne voulez pas configurer SMS maintenant, utilisez l'authentification par email pour tester l'application.

## ✅ Étape 7 : Créer un Bucket de Stockage pour KYC

1. Allez dans **Storage** (icône 📦)
2. Cliquez sur **"Create a new bucket"**
3. Nom du bucket : `kyc-documents`
4. **Public bucket** : ❌ NON (privé)
5. Cliquez sur **"Create bucket"**

## ✅ Étape 8 : Redémarrer l'Application

1. Arrêtez le serveur de développement (Ctrl+C dans le terminal)
2. Relancez avec :
```bash
npm run dev
```

3. Ouvrez [http://localhost:8080](http://localhost:8080)
4. L'application devrait maintenant fonctionner avec Supabase !

## ✅ Étape 9 : Tester la Connexion

1. Allez sur la page de login : [http://localhost:8080/login](http://localhost:8080/login)
2. Essayez de vous connecter avec votre email
3. Vérifiez votre boîte mail pour le code OTP
4. Entrez le code
5. ✅ Vous devriez être connecté !

## 🎉 Configuration Terminée !

Votre application MORO est maintenant connectée à Supabase !

## 📝 Notes Importantes

### **Sécurité**
- ✅ Ne partagez JAMAIS votre clé `service_role`
- ✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
- ✅ Row Level Security (RLS) est activé sur toutes les tables

### **Limites du Plan Gratuit**
- 500 MB de stockage base de données
- 1 GB de stockage fichiers
- 2 GB de bande passante
- 50,000 utilisateurs actifs mensuels

### **Prochaines Étapes**
1. Créer un compte Super Admin (voir `CREATE_SUPERADMIN.md`)
2. Configurer Wave Mobile Money (optionnel)
3. Déployer sur Vercel (voir `DEPLOY_VERCEL.md`)

## 🆘 Besoin d'Aide ?

### **Problèmes Courants**

#### **Erreur "Invalid API key"**
- Vérifiez que vous avez copié la bonne clé (anon/public)
- Vérifiez qu'il n'y a pas d'espaces avant/après dans le `.env`

#### **Erreur "Failed to fetch"**
- Vérifiez que l'URL du projet est correcte
- Vérifiez votre connexion internet

#### **Les tables n'apparaissent pas**
- Vérifiez que toutes les migrations ont été exécutées sans erreur
- Vérifiez dans SQL Editor → History pour voir les erreurs

#### **Authentification ne fonctionne pas**
- Vérifiez que le provider Email est activé
- Vérifiez vos spams pour l'email OTP

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
