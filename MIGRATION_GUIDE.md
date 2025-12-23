# Guide d'Application de la Migration SQL

## Étape 1 : Accéder à Supabase

1. Ouvrez votre navigateur et allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet MORO

## Étape 2 : Ouvrir l'Éditeur SQL

1. Dans le menu latéral gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New query** pour créer une nouvelle requête

## Étape 3 : Copier et Exécuter la Migration

1. Ouvrez le fichier `supabase/migrations/007_organization_users.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

## Étape 4 : Vérifier l'Exécution

Vous devriez voir un message de succès indiquant que la migration a été appliquée.

### Vérifications à effectuer :

1. **Vérifier la table `organization_users`** :
   ```sql
   SELECT * FROM organization_users LIMIT 5;
   ```

2. **Vérifier la colonne `is_organization_admin`** :
   ```sql
   SELECT id, name, role, is_organization_admin 
   FROM user_profiles 
   WHERE role IN ('cooperative', 'institution') 
   LIMIT 5;
   ```

3. **Vérifier les politiques RLS** :
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename = 'organization_users';
   ```

## Étape 5 : Marquer les Administrateurs d'Organisation

Pour marquer le premier utilisateur de chaque organisation comme administrateur :

```sql
-- Pour les coopératives
UPDATE user_profiles 
SET is_organization_admin = true 
WHERE role = 'cooperative';

-- Pour les institutions
UPDATE user_profiles 
SET is_organization_admin = true 
WHERE role = 'institution';
```

## Étape 6 : Test

Testez que tout fonctionne en créant une relation test :

```sql
-- Remplacez les UUIDs par des IDs réels de votre base
INSERT INTO organization_users (organization_id, user_id, role, permissions)
VALUES (
  'uuid-de-votre-cooperative',
  'uuid-dun-entrepreneur',
  'member',
  '{"read": true, "write": true, "delete": false, "manage_users": false}'::jsonb
);
```

## En Cas d'Erreur

### Erreur : "relation already exists"
La table existe déjà. Vous pouvez :
- Ignorer cette erreur si la structure est correcte
- Ou supprimer la table d'abord : `DROP TABLE IF EXISTS organization_users CASCADE;`

### Erreur : "column already exists"
La colonne existe déjà. Vous pouvez :
- Ignorer cette erreur
- Ou modifier la migration pour utiliser `ADD COLUMN IF NOT EXISTS`

### Erreur : "policy already exists"
Les politiques existent déjà. Supprimez-les d'abord :
```sql
DROP POLICY IF EXISTS "Organization admins can view their users" ON organization_users;
-- Répétez pour chaque politique
```

## Prochaines Étapes

Une fois la migration appliquée avec succès :
1. Redémarrez votre serveur de développement
2. Testez les nouvelles pages de gestion des utilisateurs
3. Testez l'invitation d'utilisateurs
4. Testez la gestion des permissions
