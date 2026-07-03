-- ═══════════════════════════════════════════════════════════════
-- MULTI-TENANT SCHOOL MANAGEMENT SYSTEM — Supabase Schema
-- Run this in Supabase SQL Editor to wipe and reset for SaaS
-- ═══════════════════════════════════════════════════════════════

-- WIPE EXISTING DATA
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenditures CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS transfer_certificates CASCADE;
DROP TABLE IF EXISTS fee_collections CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS exam_marks CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
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
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('super_admin', 'principal', 'clerk', 'teacher')),
  assigned_classes TEXT[] DEFAULT '{}',
  must_change_password BOOLEAN DEFAULT FALSE,
  password_changed_at TIMESTAMPTZ,
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
  parent_name TEXT NOT NULL, -- Serves as Primary/Father/Guardian Name
  mother_name TEXT DEFAULT '',
  mother_tongue TEXT DEFAULT '',
  parent_phone TEXT NOT NULL, -- Father's phone
  mother_phone TEXT DEFAULT '',
  guardian_phone TEXT DEFAULT '',
  parent_email TEXT DEFAULT '',
  address TEXT DEFAULT '', -- Present Address
  permanent_address TEXT DEFAULT '',
  father_occupation TEXT DEFAULT '',
  mother_occupation TEXT DEFAULT '',
  father_occupation_desc TEXT DEFAULT '',
  mother_occupation_desc TEXT DEFAULT '',
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

-- ── Expenditures ──────────────────────────────────────────────
CREATE TABLE expenditures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT DEFAULT '',
  payment_mode TEXT DEFAULT 'cash',
  vendor_name TEXT DEFAULT '',
  academic_year TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Teachers ──────────────────────────────────────────────────
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  joining_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, employee_id)
);

-- ── Staff ───────────────────────────────────────────────────
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  joining_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, employee_id)
);

-- ── Exams ───────────────────────────────────────────────────
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name, term, academic_year)
);

-- ── Exam Marks ──────────────────────────────────────────────
CREATE TABLE exam_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  marks_obtained NUMERIC DEFAULT 0,
  max_marks NUMERIC DEFAULT 100,
  grade TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, exam_id, student_id, subject)
);

-- ── Attendance ──────────────────────────────────────────────
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_id, date)
);


-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_expenditures_school ON expenditures(school_id);
CREATE INDEX idx_expenditures_date ON expenditures(school_id, date);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile when a user signs up
-- ═══════════════════════════════════════════════════════════════

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
    TRUE  -- Must change password on first login
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
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow individual read profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can read all audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (Must be run as superuser or in Supabase SQL editor)
-- ═══════════════════════════════════════════════════════════════

-- Create the "logos" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true) 
ON CONFLICT (id) DO NOTHING;

-- Create the "photos" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read logos and photos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('logos', 'photos'));

-- Allow authenticated users to upload logos and photos
DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;
CREATE POLICY "Auth Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('logos', 'photos') AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own logos and photos
DROP POLICY IF EXISTS "Auth Updates" ON storage.objects;
CREATE POLICY "Auth Updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('logos', 'photos') AND auth.role() = 'authenticated');
