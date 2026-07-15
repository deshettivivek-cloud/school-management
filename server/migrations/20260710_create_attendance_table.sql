-- Attendance Module Schema Migration
-- Execute this in the Supabase SQL Editor

-- 1. Drop the old table completely to remove any legacy columns (like 'method')
DROP TABLE IF EXISTS public.attendance CASCADE;

-- 2. Create the fresh table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    class_reference TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a student can only have one attendance record per day
    UNIQUE(student_id, date)
);

-- 3. Add the check constraint
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'leave'));

-- 4. Create Indexes for faster queries
CREATE INDEX idx_attendance_school_class_date ON public.attendance(school_id, class_reference, date);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
