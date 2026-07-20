-- ═══════════════════════════════════════════════════════════════
-- MASTER DATABASE — School Registry + Super Admin Profiles
-- Run this ONCE on your SQL Server to create the master database.
-- ═══════════════════════════════════════════════════════════════

-- Create master database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'school_master_db')
BEGIN
    CREATE DATABASE school_master_db;
END
GO

USE school_master_db;
GO

-- ── Schools Registry (One row per school tenant) ──────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'schools')
CREATE TABLE schools (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    join_code NVARCHAR(50) UNIQUE NOT NULL,
    db_name NVARCHAR(128) NOT NULL,        -- e.g. 'school_ABC123_db'
    logo_url NVARCHAR(500) DEFAULT '',
    address NVARCHAR(500) DEFAULT '',
    phone NVARCHAR(20) DEFAULT '',
    email NVARCHAR(255) DEFAULT '',
    academic_year NVARCHAR(20) NOT NULL,
    academic_year_start DATE,
    academic_year_end DATE,
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── Super Admin Profiles ──────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'super_admin_profiles')
CREATE TABLE super_admin_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL DEFAULT 'Super Admin',
    role NVARCHAR(20) DEFAULT 'super_admin',
    must_change_password BIT DEFAULT 1,
    password_changed_at DATETIMEOFFSET,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ── System-wide Audit Logs ────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
CREATE TABLE audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    school_id UNIQUEIDENTIFIER,
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
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_schools_join_code')
    CREATE INDEX idx_schools_join_code ON schools(join_code);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_school')
    CREATE INDEX idx_audit_school ON audit_logs(school_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_created')
    CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
GO

PRINT '✅ Master database (school_master_db) created successfully!';
GO
