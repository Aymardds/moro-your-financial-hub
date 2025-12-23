-- ============================================================================
-- Migration: Fix RLS Infinite Recursion
-- Description: Replaces recursive recursive role checks with a SECURITY DEFINER function
-- ============================================================================

-- 1. Create a function to get the current user's role securely
-- This function runs with the privileges of the creator (SECURITY DEFINER),
-- allowing it to bypass RLS on user_profiles to read the role.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure role_changes table exists (in case migration 006 was missed)
CREATE TABLE IF NOT EXISTS role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on role_changes if it was just created or disabled
ALTER TABLE role_changes ENABLE ROW LEVEL SECURITY;

-- 3. Update user_profiles policies to remove recursion

-- Admins
DROP POLICY IF EXISTS "Admins can view non-superadmin profiles" ON user_profiles;
CREATE POLICY "Admins can view non-superadmin profiles" ON user_profiles
  FOR SELECT USING (
    get_my_role() = 'admin' AND role != 'superAdmin'
  );

DROP POLICY IF EXISTS "Admins can update certain profiles" ON user_profiles;
CREATE POLICY "Admins can update certain profiles" ON user_profiles
  FOR UPDATE USING (
    get_my_role() = 'admin' AND role IN ('cooperative', 'institution', 'entrepreneur', 'agent')
  );

-- SuperAdmins
DROP POLICY IF EXISTS "SuperAdmins can view all profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can view all profiles" ON user_profiles
  FOR SELECT USING (
    get_my_role() = 'superAdmin'
  );

DROP POLICY IF EXISTS "SuperAdmins can update all profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    get_my_role() = 'superAdmin'
  );

DROP POLICY IF EXISTS "SuperAdmins can delete profiles" ON user_profiles;
CREATE POLICY "SuperAdmins can delete profiles" ON user_profiles
  FOR DELETE USING (
    get_my_role() = 'superAdmin'
  );

-- 4. Update role_changes policies

DROP POLICY IF EXISTS "SuperAdmins can view all role changes" ON role_changes;
CREATE POLICY "SuperAdmins can view all role changes" ON role_changes
  FOR SELECT USING (
    get_my_role() = 'superAdmin'
  );

DROP POLICY IF EXISTS "SuperAdmins can insert role changes" ON role_changes;
CREATE POLICY "SuperAdmins can insert role changes" ON role_changes
  FOR INSERT WITH CHECK (
    get_my_role() = 'superAdmin'
  );

DROP POLICY IF EXISTS "Admins can view role changes" ON role_changes;
CREATE POLICY "Admins can view role changes" ON role_changes
  FOR SELECT USING (
    get_my_role() = 'admin'
  );

-- 5. Update organization_applications policies (Check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_applications') THEN
        DROP POLICY IF EXISTS "Admins can view all applications" ON organization_applications;
        CREATE POLICY "Admins can view all applications" 
        ON organization_applications FOR ALL 
        USING (
            get_my_role() IN ('admin', 'superAdmin')
        );
    END IF;
END $$;

-- 6. Update organization_documents policies (Check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_documents') THEN
        DROP POLICY IF EXISTS "Admins can view all documents" ON organization_documents;
        CREATE POLICY "Admins can view all documents" 
        ON organization_documents FOR ALL 
        USING (
            get_my_role() IN ('admin', 'superAdmin')
        );
    END IF;
END $$;
