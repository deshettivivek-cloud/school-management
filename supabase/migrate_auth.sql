-- ═══════════════════════════════════════════════════════════════
-- AUTH MIGRATION — Idempotent (safe to run multiple times)
-- Run this in Supabase SQL Editor on an existing database
-- ═══════════════════════════════════════════════════════════════

-- 1. Add must_change_password column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Add password_changed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_changed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Update the role CHECK constraint to include 'super_admin'
--    Drop old constraint and create new one
DO $$
BEGIN
  -- Find and drop the existing check constraint on role
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Drop the constraint (name may vary, so we find it dynamically)
    EXECUTE (
      SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = 'profiles' AND column_name = 'role'
      LIMIT 1
    );
  END IF;
  
  -- Add the new constraint with super_admin included
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'principal', 'clerk', 'teacher'));
END $$;

-- 4. Update the handle_new_user trigger to include must_change_password
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, school_id, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    NULLIF(NEW.raw_user_meta_data->>'schoolId', '')::uuid,
    TRUE  -- New users must change password on first login
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- VERIFY MIGRATION
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
