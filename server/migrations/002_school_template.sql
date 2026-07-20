-- ═══════════════════════════════════════════════════════════════
-- SCHOOL DATABASE TEMPLATE
-- This is used as a template when creating a new school database.
-- Each school gets its own copy of this schema.
-- NOTE: No school_id column — the entire database IS the tenant.
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles (users of this school) ───────────────────────────
CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL DEFAULT 'User',
    role NVARCHAR(20) NOT NULL DEFAULT 'teacher'
        CHECK (role IN ('principal', 'clerk', 'teacher')),
    assigned_classes NVARCHAR(MAX) DEFAULT '[]',  -- JSON array of class names
    must_change_password BIT DEFAULT 1,
    password_changed_at DATETIMEOFFSET,
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Students ──────────────────────────────────────────────────
CREATE TABLE students (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    admission_no NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender NVARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    aadhar_no NVARCHAR(20),
    pen_number NVARCHAR(50),
    caste NVARCHAR(100) DEFAULT '',
    sub_caste NVARCHAR(100) DEFAULT '',
    photo_url NVARCHAR(500) DEFAULT '',
    grade NVARCHAR(20) NOT NULL,
    section NVARCHAR(10) DEFAULT '',
    parent_name NVARCHAR(255) NOT NULL,
    mother_name NVARCHAR(255) DEFAULT '',
    mother_tongue NVARCHAR(50) DEFAULT '',
    parent_phone NVARCHAR(20) NOT NULL,
    mother_phone NVARCHAR(20) DEFAULT '',
    guardian_phone NVARCHAR(20) DEFAULT '',
    parent_email NVARCHAR(255) DEFAULT '',
    address NVARCHAR(500) DEFAULT '',
    permanent_address NVARCHAR(500) DEFAULT '',
    father_occupation NVARCHAR(100) DEFAULT '',
    mother_occupation NVARCHAR(100) DEFAULT '',
    father_occupation_desc NVARCHAR(255) DEFAULT '',
    mother_occupation_desc NVARCHAR(255) DEFAULT '',
    admission_date DATE DEFAULT GETDATE(),
    admission_status NVARCHAR(20) DEFAULT 'pending'
        CHECK (admission_status IN ('pending', 'confirmed')),
    academic_year NVARCHAR(20) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Fee Structures ────────────────────────────────────────────
CREATE TABLE fee_structures (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    academic_year NVARCHAR(20) NOT NULL,
    grade NVARCHAR(20) NOT NULL,
    fee_heads NVARCHAR(MAX) NOT NULL DEFAULT '[]',  -- JSON array
    total_standard_fee DECIMAL(12,2) DEFAULT 0,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(academic_year, grade)
);
GO

-- ── Fee Collections ───────────────────────────────────────────
CREATE TABLE fee_collections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    student_id UNIQUEIDENTIFIER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year NVARCHAR(20) NOT NULL,
    committed_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    fee_breakdown NVARCHAR(MAX) DEFAULT '[]',  -- JSON
    payments NVARCHAR(MAX) DEFAULT '[]',        -- JSON
    total_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(student_id, academic_year)
);
GO

-- ── Transfer Certificates ─────────────────────────────────────
CREATE TABLE transfer_certificates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    student_id UNIQUEIDENTIFIER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tc_number NVARCHAR(50) NOT NULL UNIQUE,
    date_of_leaving DATE NOT NULL,
    reason NVARCHAR(500) NOT NULL,
    conduct NVARCHAR(50) DEFAULT 'Good',
    remarks NVARCHAR(500) DEFAULT '',
    issued_by UNIQUEIDENTIFIER REFERENCES profiles(id),
    issued_date DATE DEFAULT GETDATE(),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Blog Posts ────────────────────────────────────────────────
CREATE TABLE blog_posts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(500) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    author_id UNIQUEIDENTIFIER REFERENCES profiles(id),
    author_name NVARCHAR(255) DEFAULT '',
    cover_image_url NVARCHAR(500) DEFAULT '',
    is_published BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Expenditures ──────────────────────────────────────────────
CREATE TABLE expenditures (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    category NVARCHAR(50) NOT NULL DEFAULT 'other',
    date DATE NOT NULL DEFAULT GETDATE(),
    description NVARCHAR(500) DEFAULT '',
    payment_mode NVARCHAR(20) DEFAULT 'cash',
    vendor_name NVARCHAR(255) DEFAULT '',
    academic_year NVARCHAR(20) DEFAULT '',
    created_by UNIQUEIDENTIFIER REFERENCES profiles(id),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Teachers ──────────────────────────────────────────────────
CREATE TABLE teachers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    employee_id NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    department NVARCHAR(100) DEFAULT '',
    email NVARCHAR(255) DEFAULT '',
    phone NVARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT GETDATE(),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Staff ─────────────────────────────────────────────────────
CREATE TABLE staff (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    employee_id NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    department NVARCHAR(100) DEFAULT '',
    phone NVARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT GETDATE(),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Employees (unified employee table) ────────────────────────
CREATE TABLE employees (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER REFERENCES profiles(id),
    employee_id NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    designation NVARCHAR(100) DEFAULT '',
    department NVARCHAR(100) DEFAULT '',
    phone NVARCHAR(20) DEFAULT '',
    email NVARCHAR(255) DEFAULT '',
    class_teacher_of NVARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT GETDATE(),
    basic_salary DECIMAL(12,2) DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Salary Records ────────────────────────────────────────────
CREATE TABLE salary_records (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    employee_id UNIQUEIDENTIFIER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month NVARCHAR(7) NOT NULL,  -- e.g. '2025-07'
    basic_salary DECIMAL(12,2) DEFAULT 0,
    allowances NVARCHAR(MAX) DEFAULT '[]',  -- JSON
    deductions NVARCHAR(MAX) DEFAULT '[]',  -- JSON
    net_salary DECIMAL(12,2) DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'on_hold')),
    paid_date DATE,
    payment_mode NVARCHAR(20) DEFAULT 'bank_transfer',
    remarks NVARCHAR(500) DEFAULT '',
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(employee_id, month)
);
GO

-- ── Exams ─────────────────────────────────────────────────────
CREATE TABLE exams (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    term NVARCHAR(50) NOT NULL DEFAULT 'general',
    academic_year NVARCHAR(20) NOT NULL DEFAULT '',
    exam_type NVARCHAR(50) DEFAULT 'general',
    is_published BIT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(name, term, academic_year)
);
GO

-- ── Exam Marks ────────────────────────────────────────────────
CREATE TABLE exam_marks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    exam_id UNIQUEIDENTIFIER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UNIQUEIDENTIFIER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject NVARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(6,2) DEFAULT 0,
    max_marks DECIMAL(6,2) DEFAULT 100,
    grade NVARCHAR(10) DEFAULT '',
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(exam_id, student_id, subject)
);
GO

-- ── Attendance ────────────────────────────────────────────────
CREATE TABLE attendance (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    student_id UNIQUEIDENTIFIER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_reference NVARCHAR(20) DEFAULT '',
    date DATE NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    remarks NVARCHAR(500) DEFAULT '',
    marked_by UNIQUEIDENTIFIER REFERENCES profiles(id),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    UNIQUE(student_id, date)
);
GO

-- ── Calendar Events ───────────────────────────────────────────
CREATE TABLE calendar_events (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(500) DEFAULT '',
    type NVARCHAR(50) NOT NULL DEFAULT 'event',
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UNIQUEIDENTIFIER REFERENCES profiles(id),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Audit Logs (per school) ───────────────────────────────────
CREATE TABLE audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER,
    action NVARCHAR(100) NOT NULL,
    resource_type NVARCHAR(100) NOT NULL,
    resource_id NVARCHAR(100),
    old_values NVARCHAR(MAX),  -- JSON
    new_values NVARCHAR(MAX),  -- JSON
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_students_grade ON students(grade, academic_year);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_students_admission ON students(admission_no);
CREATE INDEX idx_fee_collections_student ON fee_collections(student_id);
CREATE INDEX idx_fee_collections_year ON fee_collections(academic_year);
CREATE INDEX idx_fee_structures_year ON fee_structures(academic_year, grade);
CREATE INDEX idx_expenditures_date ON expenditures(date);
CREATE INDEX idx_expenditures_year ON expenditures(academic_year);
CREATE INDEX idx_attendance_student ON attendance(student_id, date);
CREATE INDEX idx_attendance_class ON attendance(class_reference, date);
CREATE INDEX idx_exam_marks_exam ON exam_marks(exam_id);
CREATE INDEX idx_exam_marks_student ON exam_marks(student_id);
CREATE INDEX idx_blog_published ON blog_posts(is_published);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_salary_employee ON salary_records(employee_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
GO

PRINT '✅ School database template applied successfully!';
GO
