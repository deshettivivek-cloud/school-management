-- ═══════════════════════════════════════════════════════════════
-- SCHOOL MANAGEMENT SYSTEM — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles (extends auth.users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    'staff'
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

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- School: authenticated can read, authenticated can write (backend checks admin role)
CREATE POLICY "school_select" ON school FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "school_insert" ON school FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "school_update" ON school FOR UPDATE USING (auth.role() = 'authenticated');

-- Students: authenticated full access (backend checks roles)
CREATE POLICY "students_select" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "students_update" ON students FOR UPDATE USING (auth.role() = 'authenticated');

-- Fee structures
CREATE POLICY "fee_structures_select" ON fee_structures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fee_structures_insert" ON fee_structures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "fee_structures_update" ON fee_structures FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "fee_structures_delete" ON fee_structures FOR DELETE USING (auth.role() = 'authenticated');

-- Fee collections
CREATE POLICY "fee_collections_select" ON fee_collections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fee_collections_insert" ON fee_collections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "fee_collections_update" ON fee_collections FOR UPDATE USING (auth.role() = 'authenticated');

-- Transfer certificates
CREATE POLICY "tc_select" ON transfer_certificates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tc_insert" ON transfer_certificates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- STORAGE: Create buckets for logos and photos
-- (Run these via Supabase Dashboard → Storage → Create Bucket)
-- Bucket names: "logos", "photos"
-- Set both to Public
-- ═══════════════════════════════════════════════════════════════
