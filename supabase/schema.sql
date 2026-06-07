-- ═══════════════════════════════════════════════════════════════
-- MULTI-TENANT SCHOOL MANAGEMENT SYSTEM — Supabase Schema
-- Run this in Supabase SQL Editor to wipe and reset for SaaS
-- ═══════════════════════════════════════════════════════════════

-- WIPE EXISTING DATA
DROP TABLE IF EXISTS transfer_certificates CASCADE;
DROP TABLE IF EXISTS fee_collections CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS school CASCADE;

-- ── Schools (Tenants) ─────────────────────────────────────────
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
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

-- ── Profiles (extends auth.users) ─────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('principal', 'clerk', 'teacher')),
  assigned_classes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Students ──────────────────────────────────────────────────
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_no TEXT NOT NULL,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  aadhar_no TEXT,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, admission_no)
);

-- ── Fee Structures ────────────────────────────────────────────
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  grade TEXT NOT NULL,
  fee_heads JSONB NOT NULL DEFAULT '[]',
  total_standard_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, academic_year, grade)
);

-- ── Fee Collections ───────────────────────────────────────────
CREATE TABLE fee_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
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
  UNIQUE(school_id, student_id, academic_year)
);

-- ── Transfer Certificates ─────────────────────────────────────
CREATE TABLE transfer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tc_number TEXT NOT NULL,
  date_of_leaving DATE NOT NULL,
  reason TEXT NOT NULL,
  conduct TEXT DEFAULT 'Good',
  remarks TEXT DEFAULT '',
  issued_by UUID REFERENCES auth.users(id),
  issued_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, tc_number)
);

-- ── Blog Posts ─────────────────────────────────────────────────
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_grade ON students(school_id, grade, academic_year);
CREATE INDEX idx_fee_collections_school ON fee_collections(school_id);
CREATE INDEX idx_tc_school ON transfer_certificates(school_id);
CREATE INDEX idx_blog_school ON blog_posts(school_id);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile when a user signs up
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'teacher',
    NULL -- They must join or create a school later
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) - Bypassed by Backend, used for Edge
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow individual read profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
