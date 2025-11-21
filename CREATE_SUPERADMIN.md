# Comment créer un compte Super Admin

## 📋 Étapes pour créer un compte Super Admin

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Se connecter à Supabase Dashboard**
   - Aller sur [supabase.com](https://supabase.com)
   - Ouvrir votre projet

2. **Créer un utilisateur**
   - Aller dans **Authentication** → **Users**
   - Cliquer sur **Add User** → **Create new user**
   - Entrer un email (ex: `admin@moro.com`)
   - Générer un mot de passe ou laisser Supabase le générer
   - Cliquer sur **Create User**

3. **Mettre à jour le rôle dans la base de données**
   - Aller dans **SQL Editor**
   - Exécuter cette requête (remplacer `votre-user-id` par l'ID de l'utilisateur créé) :

```sql
-- Récupérer l'ID de l'utilisateur depuis Authentication → Users
-- Puis exécuter :

INSERT INTO user_profiles (id, email, role) 
VALUES ('votre-user-id-ici', 'admin@moro.com', 'superAdmin')
ON CONFLICT (id) DO UPDATE SET role = 'superAdmin';
```

### Option 2 : Via l'application (après connexion) - RECOMMANDÉ

1. **Exécuter d'abord les migrations SQL**
   - Exécuter `002_add_superadmin.sql` dans Supabase SQL Editor
   - Exécuter `003_add_email_column.sql` dans Supabase SQL Editor

2. **Se connecter avec votre email**
   - Aller sur `/login`
   - Utiliser l'onglet **Email**
   - Entrer votre email (ex: `dstephaneaymard@gmail.com`)
   - Recevoir le code OTP et se connecter

3. **Trouver votre User ID**
   - Dans Supabase Dashboard → **Authentication** → **Users**
   - Trouver votre utilisateur par email
   - Copier l'**User UID**

4. **Mettre à jour votre rôle**
   - Aller dans **SQL Editor**
   - Exécuter cette requête (remplacer `VOTRE-USER-ID` par l'UID copié) :

```sql
-- Méthode 1 : Avec User ID (RECOMMANDÉ)
UPDATE user_profiles 
SET role = 'superAdmin', email = 'dstephaneaymard@gmail.com'
WHERE id = 'VOTRE-USER-ID';

-- Si le profil n'existe pas encore, créer :
INSERT INTO user_profiles (id, email, role) 
VALUES ('VOTRE-USER-ID', 'dstephaneaymard@gmail.com', 'superAdmin')
ON CONFLICT (id) DO UPDATE 
SET role = 'superAdmin', email = 'dstephaneaymard@gmail.com';
```

### Option 3 : Via SQL directement (Méthode la plus simple)

**Étape 1 : Exécuter les migrations**
- Exécuter `002_add_superadmin.sql` dans Supabase SQL Editor
- Exécuter `003_add_email_column.sql` dans Supabase SQL Editor

**Étape 2 : Trouver votre User ID**
1. Aller dans **Supabase Dashboard** → **Authentication** → **Users**
2. Chercher votre utilisateur par email : `dstephaneaymard@gmail.com`
3. Copier l'**User UID** (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Étape 3 : Mettre à jour le rôle**

```sql
-- Méthode avec User ID (remplacer par votre vrai User ID)
UPDATE user_profiles 
SET role = 'superAdmin', email = 'dstephaneaymard@gmail.com'
WHERE id = 'VOTRE-USER-ID-ICI';

-- Si le profil n'existe pas encore :
INSERT INTO user_profiles (id, email, role, name) 
VALUES (
  'VOTRE-USER-ID-ICI',
  'dstephaneaymard@gmail.com',
  'superAdmin',
  'Super Administrateur'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'superAdmin', 
    email = 'dstephaneaymard@gmail.com';
```

**Étape 4 : Vérifier**
```sql
-- Vérifier que le rôle a été mis à jour
SELECT id, email, role, name 
FROM user_profiles 
WHERE email = 'dstephaneaymard@gmail.com';
```

## ✅ Vérification

Après avoir créé le compte Super Admin :

1. **Se déconnecter** de l'application
2. **Se reconnecter** avec l'email du Super Admin
3. Vous devriez être redirigé vers `/dashboard` avec le **Dashboard Super Admin**

## 🔐 Sécurité

- Le rôle `superAdmin` a accès à toutes les fonctionnalités
- Peut modifier les rôles de tous les utilisateurs
- Peut voir toutes les statistiques système
- Utilisez ce rôle avec précaution

## 📝 Notes

- Assurez-vous d'avoir exécuté la migration `002_add_superadmin.sql`
- Le rôle doit être exactement `'superAdmin'` (sensible à la casse)
- Un seul Super Admin est recommandé pour la sécurité

