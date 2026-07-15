const { createClient } = require('@supabase/supabase-js');

// Bypass RLS for aggregate/read-only dashboard queries using the service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch data for all widgets and calendar
exports.getDashboardWidgets = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const role = req.user.role;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School ID required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextMonthDate = new Date();
    nextMonthDate.setDate(nextMonthDate.getDate() + 30);
    const nextMonth = nextMonthDate.toISOString().split('T')[0];

    const addDateRangeEvents = (eventsArr, item, prefix, title, type) => {
      if (!item.start_date) return;
      eventsArr.push({ id: `${prefix}-${item.id}`, title, date: item.start_date, type });
      if (item.end_date && item.end_date > item.start_date) {
        let current = new Date(item.start_date);
        const end = new Date(item.end_date);
        current.setDate(current.getDate() + 1);
        let counter = 1;
        while (current <= end) {
          eventsArr.push({ id: `${prefix}-${item.id}-${counter}`, title, date: current.toISOString().split('T')[0], type });
          current.setDate(current.getDate() + 1);
          counter++;
        }
      }
    };

    // Prepare queries based on role requirements
    const tasks = [];

    // 1. Recent Admissions (Super Admin, Principal, Clerk)
    let recentAdmissions = null;
    if (['super_admin', 'principal', 'clerk'].includes(role)) {
      tasks.push(
        supabase.from('students')
          .select('id, name, grade, created_at')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error && error.code !== '42P01') console.error('Admissions Error:', error);
            recentAdmissions = { data: data || [], error: error ? error.message : null };
          })
      );
    }

    // 2. Recent Payments (Super Admin, Principal, Clerk)
    let recentPayments = null;
    if (['super_admin', 'principal', 'clerk'].includes(role)) {
      tasks.push(
        supabase.from('fee_collections')
          .select('id, academic_year, total_paid, updated_at, students(name)')
          .eq('school_id', schoolId)
          .gt('total_paid', 0)
          .order('updated_at', { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error && error.code !== '42P01') console.error('Payments Error:', error);
            recentPayments = { data: data || [], error: error ? error.message : null };
          })
      );
    }

    // 3. Pending Approvals (Super Admin, Principal)
    let pendingApprovals = null;
    if (['super_admin', 'principal'].includes(role)) {
      tasks.push(
        supabase.from('students')
          .select('id, name, grade, admission_status')
          .eq('school_id', schoolId)
          .eq('admission_status', 'pending')
          .limit(5)
          .then(({ data, error }) => {
            if (error && error.code !== '42P01') console.error('Pending Approvals Error:', error);
            pendingApprovals = { data: data || [], error: error ? error.message : null };
          })
      );
    }

    // 4. Upcoming Exams (All Roles) - For both widget and calendar
    let upcomingExams = null;
    let calendarEvents = [];
    tasks.push(
      supabase.from('exams')
        .select('id, name, start_date, end_date')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: true })
        .then(({ data, error }) => {
          if (error && error.code !== '42P01') console.error('Exams Error:', error);
          const allExams = data || [];
          upcomingExams = { 
            data: allExams.filter(e => e.start_date >= today && e.start_date <= nextMonth).slice(0, 5), 
            error: error ? error.message : null 
          };
          allExams.forEach(exam => {
            addDateRangeEvents(calendarEvents, exam, 'exam', `Exam: ${exam.name}`, 'exam');
          });
        })
    );

    // 5. Announcements (All Roles) - For both widget and calendar
    let latestAnnouncements = null;
    tasks.push(
      supabase.from('blog_posts')
        .select('id, title, created_at')
        .eq('school_id', schoolId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error && error.code !== '42P01') console.error('Announcements Error:', error);
          const announcements = data || [];
          latestAnnouncements = { data: announcements.slice(0, 5), error: error ? error.message : null };
          announcements.forEach(ann => {
            if (ann.created_at) {
              calendarEvents.push({ id: `ann-${ann.id}`, title: `Announcement: ${ann.title}`, date: ann.created_at.split('T')[0], type: 'announcement' });
            }
          });
        })
    );

    // 6. Custom Calendar Events (Holidays & Custom Events)
    tasks.push(
      supabase.from('calendar_events')
        .select('id, title, type, start_date, end_date')
        .eq('school_id', schoolId)
        .then(({ data, error }) => {
          if (error && error.code !== '42P01') console.error('Custom Events Error:', error);
          const customEvents = data || [];
          customEvents.forEach(ev => {
            addDateRangeEvents(calendarEvents, ev, 'custom', ev.title, ev.type);
          });
        })
    );

    await Promise.all(tasks);

    res.json({
      success: true,
      data: {
        recentAdmissions,
        recentPayments,
        pendingApprovals,
        upcomingExams,
        latestAnnouncements,
        calendarEvents: { data: calendarEvents, error: null }
      }
    });
  } catch (error) {
    console.error('Dashboard Widget Error:', error);
    res.status(500).json({ success: false, message: 'Server error loading widgets', error: error.message });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { title, description, type, start_date, end_date } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School ID required' });
    }

    if (!title || !type || !start_date) {
      return res.status(400).json({ success: false, message: 'Title, type, and start_date are required' });
    }

    let result;
    if (type === 'exam') {
      result = await supabase
        .from('exams')
        .insert([{
          id: require('crypto').randomUUID(),
          school_id: schoolId,
          name: title,
          start_date,
          end_date: end_date || null,
          exam_type: 'general',
          is_published: true
        }])
        .select()
        .single();
    } else {
      result = await supabase
        .from('calendar_events')
        .insert([{
          school_id: schoolId,
          title,
          description,
          type,
          start_date,
          end_date: end_date || null,
          created_by: req.user.id
        }])
        .select()
        .single();
    }
    
    const { data, error } = result;

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating event', error: error.message });
  }
};
