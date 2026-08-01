CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'User',
    role VARCHAR(20) NOT NULL DEFAULT 'teacher' CHECK (role IN ('principal', 'clerk', 'teacher')),
    assigned_classes LONGTEXT,
    must_change_password BOOLEAN DEFAULT TRUE,
    password_changed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admission_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    aadhar_no VARCHAR(20),
    pen_number VARCHAR(50),
    caste VARCHAR(100) DEFAULT '',
    sub_caste VARCHAR(100) DEFAULT '',
    photo_url VARCHAR(500) DEFAULT '',
    grade VARCHAR(20) NOT NULL,
    section VARCHAR(10) DEFAULT '',
    parent_name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255) DEFAULT '',
    mother_tongue VARCHAR(50) DEFAULT '',
    parent_phone VARCHAR(20) NOT NULL,
    mother_phone VARCHAR(20) DEFAULT '',
    guardian_phone VARCHAR(20) DEFAULT '',
    parent_email VARCHAR(255) DEFAULT '',
    address VARCHAR(500) DEFAULT '',
    permanent_address VARCHAR(500) DEFAULT '',
    father_occupation VARCHAR(100) DEFAULT '',
    mother_occupation VARCHAR(100) DEFAULT '',
    father_occupation_desc VARCHAR(255) DEFAULT '',
    mother_occupation_desc VARCHAR(255) DEFAULT '',
    admission_date DATE DEFAULT (CURRENT_DATE),
    admission_status VARCHAR(20) DEFAULT 'pending' CHECK (admission_status IN ('pending', 'confirmed')),
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_students_grade (grade, academic_year),
    INDEX idx_students_active (is_active),
    INDEX idx_students_admission (admission_no)
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    academic_year VARCHAR(20) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    fee_heads LONGTEXT,
    total_standard_fee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(academic_year, grade),
    INDEX idx_fee_structures_year (academic_year, grade)
);

CREATE TABLE IF NOT EXISTS fee_collections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    committed_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    fee_breakdown LONGTEXT,
    payments LONGTEXT,
    total_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year),
    INDEX idx_fee_collections_student (student_id),
    INDEX idx_fee_collections_year (academic_year)
);

CREATE TABLE IF NOT EXISTS transfer_certificates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tc_number VARCHAR(50) NOT NULL UNIQUE,
    date_of_leaving DATE NOT NULL,
    reason VARCHAR(500) NOT NULL,
    conduct VARCHAR(50) DEFAULT 'Good',
    remarks VARCHAR(500) DEFAULT '',
    issued_by VARCHAR(36) REFERENCES profiles(id),
    issued_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    author_id VARCHAR(36) REFERENCES profiles(id),
    author_name VARCHAR(255) DEFAULT '',
    cover_image_url VARCHAR(500) DEFAULT '',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blog_published (is_published)
);

CREATE TABLE IF NOT EXISTS expenditures (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    date DATE DEFAULT (CURRENT_DATE),
    description VARCHAR(500) DEFAULT '',
    payment_mode VARCHAR(20) DEFAULT 'cash',
    vendor_name VARCHAR(255) DEFAULT '',
    academic_year VARCHAR(20) DEFAULT '',
    created_by VARCHAR(36) REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expenditures_date (date),
    INDEX idx_expenditures_year (academic_year)
);

CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) REFERENCES profiles(id),
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) DEFAULT '',
    department VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    class_teacher_of VARCHAR(20) DEFAULT '',
    joining_date DATE DEFAULT (CURRENT_DATE),
    basic_salary DECIMAL(12,2) DEFAULT 0,
    gender VARCHAR(20) DEFAULT '',
    dob DATE,
    blood_group VARCHAR(10) DEFAULT '',
    alt_mobile VARCHAR(20) DEFAULT '',
    aadhaar_no VARCHAR(20) DEFAULT '',
    pan_no VARCHAR(20) DEFAULT '',
    address VARCHAR(255) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    pincode VARCHAR(20) DEFAULT '',
    employment_type VARCHAR(50) DEFAULT 'Full Time',
    qualification VARCHAR(255) DEFAULT '',
    experience VARCHAR(255) DEFAULT '',
    hra DECIMAL(12,2) DEFAULT 0,
    da DECIMAL(12,2) DEFAULT 0,
    medical_allowance DECIMAL(12,2) DEFAULT 0,
    special_allowance DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    pf DECIMAL(12,2) DEFAULT 0,
    professional_tax DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    bank_name VARCHAR(100) DEFAULT '',
    account_no VARCHAR(100) DEFAULT '',
    ifsc_code VARCHAR(20) DEFAULT '',
    remarks VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employees_user (user_id)
);

CREATE TABLE IF NOT EXISTS salary_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id VARCHAR(36) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    allowances LONGTEXT,
    deductions LONGTEXT,
    net_salary DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'on_hold')),
    paid_date DATE,
    payment_mode VARCHAR(20) DEFAULT 'bank_transfer',
    leaves_taken INT DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remarks VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month),
    INDEX idx_salary_employee (employee_id)
);

CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    term VARCHAR(50) NOT NULL DEFAULT 'general',
    academic_year VARCHAR(20) NOT NULL DEFAULT '',
    exam_type VARCHAR(50) DEFAULT 'general',
    is_published BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, term, academic_year)
);

CREATE TABLE IF NOT EXISTS exam_marks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    exam_id VARCHAR(36) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(6,2) DEFAULT 0,
    max_marks DECIMAL(6,2) DEFAULT 100,
    grade VARCHAR(10) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id, subject),
    INDEX idx_exam_marks_exam (exam_id),
    INDEX idx_exam_marks_student (student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_reference VARCHAR(20) DEFAULT '',
    date DATE DEFAULT (CURRENT_DATE),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    remarks VARCHAR(500) DEFAULT '',
    marked_by VARCHAR(36) REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(student_id, date),
    INDEX idx_attendance_student (student_id, date),
    INDEX idx_attendance_class (class_reference, date)
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(500) DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'event',
    start_date DATE NOT NULL,
    end_date DATE,
    created_by VARCHAR(36) REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_values LONGTEXT,
    new_values LONGTEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at DESC)
);

CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    gateway_response VARCHAR(500) DEFAULT '',
    message_id VARCHAR(100) DEFAULT '',
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
    channel VARCHAR(20) DEFAULT 'sms',
    sent_by VARCHAR(36) REFERENCES profiles(id),
    sent_by_name VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sms_logs_created (created_at DESC),
    INDEX idx_sms_logs_phone (phone)
);
