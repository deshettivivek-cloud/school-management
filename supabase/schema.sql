-- ═══════════════════════════════════════════════════════════════
-- SCHOOL MANAGEMENT SYSTEM — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles (extends auth.users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('principal', 'clerk', 'teacher')),
  assigned_classes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handle schema upgrades for existing databases
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='assigned_classes') THEN
    ALTER TABLE profiles ADD COLUMN assigned_classes TEXT[] DEFAULT '{}';
  END IF;
  
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('principal', 'clerk', 'teacher'));
  ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'teacher';
END $$;

-- ── School Config (singleton) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  academic_year TEXT NOT NULL,
  academic_year_start DATE,
  academic_year_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Students ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  photo_url TEXT DEFAULT '',
  grade TEXT NOT NULL,
  section TEXT DEFAULT '',
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  admission_date DATE DEFAULT CURRENT_DATE,
  admission_status TEXT DEFAULT 'pending' CHECK (admission_status IN ('pending', 'confirmed')),
  academic_year TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fee Structures ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  grade TEXT NOT NULL,
  fee_heads JSONB NOT NULL DEFAULT '[]',
  total_standard_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year, grade)
);

-- ── Fee Collections ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  committed_fee NUMERIC NOT NULL DEFAULT 0,
  fee_breakdown JSONB DEFAULT '[]',
  payments JSONB DEFAULT '[]',
  total_paid NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, academic_year)
);

-- ── Transfer Certificates ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tc_number TEXT UNIQUE NOT NULL,
  date_of_leaving DATE NOT NULL,
  reason TEXT NOT NULL,
  conduct TEXT DEFAULT 'Good',
  remarks TEXT DEFAULT '',
  issued_by UUID REFERENCES auth.users(id),
  issued_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade, academic_year);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(admission_status);
CREATE INDEX IF NOT EXISTS idx_fee_collections_status ON fee_collections(status);
CREATE INDEX IF NOT EXISTS idx_fee_collections_student ON fee_collections(student_id, academic_year);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile when a user signs up
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_certificates ENABLE ROW LEVEL SECURITY;

-- Security Definer Functions for Role Checks (to avoid infinite recursion)
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_teacher_classes() RETURNS TEXT[] AS $$
  SELECT assigned_classes FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users can read all, update own or if principal
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id OR get_user_role() = 'principal'
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- School: authenticated can read, principal can write
CREATE POLICY "school_select" ON school FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "school_insert" ON school FOR INSERT WITH CHECK (get_user_role() = 'principal');
CREATE POLICY "school_update" ON school FOR UPDATE USING (get_user_role() = 'principal');

-- Students: Principal & Clerk (all), Teacher (assigned classes)
CREATE POLICY "students_select" ON students FOR SELECT USING (
  get_user_role() IN ('principal', 'clerk') OR 
  (get_user_role() = 'teacher' AND grade = ANY(get_teacher_classes()))
);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (
  get_user_role() IN ('principal', 'clerk') OR 
  (get_user_role() = 'teacher' AND grade = ANY(get_teacher_classes()))
);
CREATE POLICY "students_update" ON students FOR UPDATE USING (
  get_user_role() IN ('principal', 'clerk') OR 
  (get_user_role() = 'teacher' AND grade = ANY(get_teacher_classes()))
);

-- Fee structures: read all, write principal
CREATE POLICY "fee_structures_select" ON fee_structures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fee_structures_insert" ON fee_structures FOR INSERT WITH CHECK (get_user_role() = 'principal');
CREATE POLICY "fee_structures_update" ON fee_structures FOR UPDATE USING (get_user_role() = 'principal');
CREATE POLICY "fee_structures_delete" ON fee_structures FOR DELETE USING (get_user_role() = 'principal');

-- Fee collections: read/write principal and clerk
CREATE POLICY "fee_collections_select" ON fee_collections FOR SELECT USING (
  get_user_role() IN ('principal', 'clerk')
);
CREATE POLICY "fee_collections_insert" ON fee_collections FOR INSERT WITH CHECK (
  get_user_role() IN ('principal', 'clerk')
);
CREATE POLICY "fee_collections_update" ON fee_collections FOR UPDATE USING (
  get_user_role() IN ('principal', 'clerk')
);

-- Transfer certificates: read/write principal and clerk
CREATE POLICY "tc_select" ON transfer_certificates FOR SELECT USING (
  get_user_role() IN ('principal', 'clerk')
);
CREATE POLICY "tc_insert" ON transfer_certificates FOR INSERT WITH CHECK (
  get_user_role() IN ('principal', 'clerk')
);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE: Create buckets for logos and photos
-- (Run these via Supabase Dashboard → Storage → Create Bucket)
-- Bucket names: "logos", "photos"
-- Set both to Public
-- ═══════════════════════════════════════════════════════════════
