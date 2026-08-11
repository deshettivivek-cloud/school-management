-- Employee Management and Salary System Schema Migration
-- Execute this in the Supabase SQL Editor

-- 1. Create the employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Personal Information
    name TEXT NOT NULL,
    gender TEXT,
    dob DATE,
    mobile TEXT,
    alt_mobile TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    aadhaar_no TEXT,
    pan_no TEXT,
    blood_group TEXT,
    photo_url TEXT,
    
    -- Professional Information
    emp_id TEXT,
    joining_date DATE,
    designation TEXT,
    department TEXT,
    subject TEXT[],
    class_teacher_of TEXT,
    employment_type TEXT DEFAULT 'Full Time',
    qualification TEXT,
    experience TEXT,
    status TEXT DEFAULT 'Active',
    
    -- Salary Structure
    basic_salary NUMERIC DEFAULT 0,
    hra NUMERIC DEFAULT 0,
    da NUMERIC DEFAULT 0,
    medical_allowance NUMERIC DEFAULT 0,
    special_allowance NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    pf NUMERIC DEFAULT 0,
    professional_tax NUMERIC DEFAULT 0,
    other_deductions NUMERIC DEFAULT 0,
    
    -- Bank Details
    bank_name TEXT,
    account_no TEXT,
    ifsc_code TEXT,
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the employee_salaries (salary history) table
CREATE TABLE IF NOT EXISTS public.employee_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    
    -- Snapshot of earnings
    basic_salary NUMERIC DEFAULT 0,
    hra NUMERIC DEFAULT 0,
    da NUMERIC DEFAULT 0,
    medical_allowance NUMERIC DEFAULT 0,
    special_allowance NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    
    -- Snapshot of deductions
    pf NUMERIC DEFAULT 0,
    professional_tax NUMERIC DEFAULT 0,
    other_deductions NUMERIC DEFAULT 0,
    
    -- Computed Totals
    gross_salary NUMERIC DEFAULT 0,
    total_deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC DEFAULT 0,
    
    -- Manual Overrides
    leaves_taken NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    
    
    payment_date DATE,
    payment_mode TEXT,
    status TEXT DEFAULT 'Pending',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Migrate existing teachers (from profiles) into employees
INSERT INTO public.employees (
    id, school_id, user_id, name, email, department, designation, status, created_at
)
SELECT 
    gen_random_uuid(), 
    school_id, 
    id, 
    name, 
    email, 
    'Teaching', 
    'Teacher', 
    'Active', 
    created_at
FROM public.profiles 
WHERE role = 'teacher' AND school_id IS NOT NULL;

-- Migrate clerks
INSERT INTO public.employees (
    id, school_id, user_id, name, email, department, designation, status, created_at
)
SELECT 
    gen_random_uuid(), 
    school_id, 
    id, 
    name, 
    email, 
    'Administration', 
    'Clerk', 
    'Active', 
    created_at
FROM public.profiles 
WHERE role = 'clerk' AND school_id IS NOT NULL;

-- 4. Ensure new columns exist if the table was created previously
ALTER TABLE public.employee_salaries ADD COLUMN IF NOT EXISTS leaves_taken NUMERIC DEFAULT 0;
ALTER TABLE public.employee_salaries ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
