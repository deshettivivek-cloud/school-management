const supabase = require('../config/supabase');

/**
 * GET /api/teachers
 * Fetch all teachers for the current school with computed stats.
 */
const getTeachers = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    // Fetch all profiles with role 'teacher' for this school
    const { data: teachers, error: teacherError } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .order('name');

    if (teacherError) throw teacherError;

    // Fetch all active students for this school to compute per-teacher stats
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('grade')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (studentError) throw studentError;

    // Build a map: grade -> student count
    const gradeCountMap = {};
    (students || []).forEach((s) => {
      gradeCountMap[s.grade] = (gradeCountMap[s.grade] || 0) + 1;
    });

    // Enrich each teacher with computed stats
    const enrichedTeachers = (teachers || []).map((teacher, index) => {
      const assignedClasses = teacher.assigned_classes || [];
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

    const updateData = {};
    if (subject !== undefined) updateData.subject = subject;
    if (teacher_id_code !== undefined)
      updateData.teacher_id_code = teacher_id_code;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
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
