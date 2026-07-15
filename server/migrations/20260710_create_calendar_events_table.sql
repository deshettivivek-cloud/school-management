-- Create custom calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('event', 'holiday')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Super admins can do everything
CREATE POLICY "Super admins can manage all calendar events"
  ON public.calendar_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- School users can read their school's calendar events
CREATE POLICY "Users can view their school's calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Principals can create/update/delete their school's calendar events
CREATE POLICY "Principals can manage their school's calendar events"
  ON public.calendar_events
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'principal'
    )
  );
