const crypto = require('crypto');

// Fetch data for all widgets and calendar
exports.getDashboardWidgets = async (req, res) => {
  try {
    if (req.user && req.user.role === 'super_admin') {
      return res.json({ success: true, data: { isSuperAdmin: true } });
    }

    const role = req.user.role;
    const db = req.db;

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const nextMonthDate = new Date();
    nextMonthDate.setDate(nextMonthDate.getDate() + 30);
    const nextMonth = nextMonthDate.toISOString().split('T')[0];

    const addDateRangeEvents = (eventsArr, item, prefix, title, type) => {
      if (!item.start_date) return;
      const startDateStr = typeof item.start_date === 'string' ? item.start_date.split('T')[0] : item.start_date.toISOString().split('T')[0];
      eventsArr.push({ id: `${prefix}-${item.id}`, title, date: startDateStr, type });
      
      if (item.end_date && item.end_date > item.start_date) {
        let current = new Date(startDateStr);
        const end = typeof item.end_date === 'string' ? new Date(item.end_date) : item.end_date;
        current.setDate(current.getDate() + 1);
        let counter = 1;
        while (current <= end) {
          eventsArr.push({ id: `${prefix}-${item.id}-${counter}`, title, date: current.toISOString().split('T')[0], type });
          current.setDate(current.getDate() + 1);
          counter++;
        }
      }
    };

    const tasks = [];
    let recentAdmissions = null, recentPayments = null, pendingApprovals = null, upcomingExams = null, latestAnnouncements = null;
    let calendarEvents = [];

    // 1. Recent Admissions (Principal, Clerk)
    if (['principal', 'clerk'].includes(role)) {
      tasks.push(
        db.execute('SELECT id, name, grade, created_at FROM students ORDER BY created_at DESC LIMIT 5')
          .then(([rows]) => { recentAdmissions = { data: rows, error: null }; })
          .catch(err => { recentAdmissions = { data: [], error: err.message }; })
      );
    }

    // 2. Recent Payments (Principal, Clerk)
    if (['principal', 'clerk'].includes(role)) {
      tasks.push(
        db.execute(`
            SELECT fc.id, fc.academic_year, fc.total_paid, fc.updated_at, s.name as student_name
            FROM fee_collections fc
            JOIN students s ON fc.student_id = s.id
            WHERE fc.total_paid > 0
            ORDER BY fc.updated_at DESC
            LIMIT 5
          `)
          .then(([rows]) => {
            const data = rows.map(r => ({
              id: r.id, academic_year: r.academic_year, total_paid: r.total_paid, updated_at: r.updated_at,
              students: { name: r.student_name }
            }));
            recentPayments = { data, error: null };
          })
          .catch(err => { recentPayments = { data: [], error: err.message }; })
      );
    }

    // 3. Pending Approvals (Principal)
    if (['principal'].includes(role)) {
      tasks.push(
        db.execute("SELECT id, name, grade, admission_status FROM students WHERE admission_status = 'pending' ORDER BY created_at DESC LIMIT 5")
          .then(([rows]) => { pendingApprovals = { data: rows, error: null }; })
          .catch(err => { pendingApprovals = { data: [], error: err.message }; })
      );
    }

    // 4. Upcoming Exams (All Roles)
    tasks.push(
      db.execute('SELECT id, name, start_date, end_date FROM exams ORDER BY start_date ASC')
        .then(([rows]) => {
          const allExams = rows;
          const filtered = allExams.filter(e => {
            const d = typeof e.start_date === 'string' ? e.start_date : e.start_date.toISOString().split('T')[0];
            return d >= today && d <= nextMonth;
          }).slice(0, 5);
          upcomingExams = { data: filtered, error: null };
          
          allExams.forEach(exam => {
            addDateRangeEvents(calendarEvents, exam, 'exam', `Exam: ${exam.name}`, 'exam');
          });
        })
        .catch(err => { upcomingExams = { data: [], error: err.message }; })
    );

    // 5. Announcements (All Roles)
    tasks.push(
      db.execute('SELECT id, title, created_at FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC LIMIT 5')
        .then(([rows]) => {
          latestAnnouncements = { data: rows, error: null };
          rows.forEach(ann => {
            if (ann.created_at) {
              const dt = typeof ann.created_at === 'string' ? ann.created_at.split('T')[0] : ann.created_at.toISOString().split('T')[0];
              calendarEvents.push({ id: `ann-${ann.id}`, title: `Announcement: ${ann.title}`, date: dt, type: 'announcement' });
            }
          });
        })
        .catch(err => { latestAnnouncements = { data: [], error: err.message }; })
    );

    // 6. Custom Calendar Events (Holidays & Custom Events)
    tasks.push(
      db.execute('SELECT id, title, type, start_date, end_date FROM calendar_events')
        .then(([rows]) => {
          rows.forEach(ev => {
            addDateRangeEvents(calendarEvents, ev, 'custom', ev.title, ev.type);
          });
        })
        .catch(err => console.error('Custom Events Error:', err.message))
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
    const { title, description, type, start_date, end_date } = req.body;

    if (!title || !type || !start_date) {
      return res.status(400).json({ success: false, message: 'Title, type, and start_date are required' });
    }

    const eventId = crypto.randomUUID();

    if (type === 'exam') {
      await req.db.execute(`
          INSERT INTO exams (id, name, start_date, end_date, exam_type, is_published)
          VALUES (?, ?, ?, ?, 'general', 1)
        `, [eventId, title, start_date, end_date || null]);
      
      const [rows] = await req.db.execute('SELECT * FROM exams WHERE id = ?', [eventId]);
      res.status(201).json({ success: true, data: rows[0] });
    } else {
      await req.db.execute(`
          INSERT INTO calendar_events (id, title, description, type, start_date, end_date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [eventId, title, description || '', type, start_date, end_date || null, req.user.id]);
        
      const [rows] = await req.db.execute('SELECT * FROM calendar_events WHERE id = ?', [eventId]);
      res.status(201).json({ success: true, data: rows[0] });
    }
  } catch (error) {
    console.error('Create Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating event', error: error.message });
  }
};
