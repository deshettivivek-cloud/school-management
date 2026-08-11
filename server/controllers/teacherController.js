/**
 * GET /api/teachers
 * Fetch all teachers for the current school with computed stats.
 */
const getTeachers = async (req, res) => {
  try {
    const [teachers] = await req.db.execute("SELECT * FROM profiles WHERE role = 'teacher' ORDER BY name");

    const [students] = await req.db.execute("SELECT grade FROM students WHERE is_active = 1");

    // Build a map: grade -> student count
    const gradeCountMap = {};
    students.forEach((s) => {
      gradeCountMap[s.grade] = (gradeCountMap[s.grade] || 0) + 1;
    });

    // Enrich each teacher with computed stats
    const enrichedTeachers = teachers.map((teacher, index) => {
      let assignedClasses = [];
      try {
        if (teacher.assigned_classes) {
          assignedClasses = JSON.parse(teacher.assigned_classes);
        }
      } catch(e) {}
      
      const classesCount = assignedClasses.length;

      // Sum students across all assigned classes
      let studentsCount = 0;
      assignedClasses.forEach((grade) => {
        studentsCount += gradeCountMap[grade] || 0;
      });

      // Generate teacher ID code if not set
      const teacherIdCode =
        teacher.teacher_id_code ||
        `TCH-${String(index + 1).padStart(3, '0')}`;

      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject || '',
        assigned_classes: assignedClasses,
        classesCount,
        studentsCount,
        teacherIdCode,
        created_at: teacher.created_at,
      };
    });

    // Compute department/subject count
    const uniqueSubjects = new Set(
      enrichedTeachers
        .map((t) => t.subject)
        .filter((s) => s && s.trim() !== '')
    );

    res.json({
      success: true,
      data: {
        teachers: enrichedTeachers,
        totalTeachers: enrichedTeachers.length,
        totalDepartments: uniqueSubjects.size || enrichedTeachers.length,
      },
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message,
    });
  }
};

/**
 * PUT /api/teachers/:id
 * Update teacher details (subject, teacher_id_code).
 */
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, teacher_id_code } = req.body;

    let setClauses = [];
    let values = [];
    
    if (subject !== undefined) {
      setClauses.push('subject = ?');
      values.push(subject);
    }
    if (teacher_id_code !== undefined) {
      setClauses.push('teacher_id_code = ?');
      values.push(teacher_id_code);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    
    await req.db.execute(`
      UPDATE profiles 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `, values);

    const [rows] = await req.db.execute('SELECT * FROM profiles WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({
      success: true,
      data: rows[0],
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher',
      error: error.message,
    });
  }
};

module.exports = { getTeachers, updateTeacher };
