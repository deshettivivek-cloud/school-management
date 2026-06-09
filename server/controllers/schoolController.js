const supabase = require('../config/supabase');
const crypto = require('crypto');

// Helper to generate a random 6-character join code
const generateJoinCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @desc    Register a new school (Tenant)
// @route   POST /api/schools/register
// @access  Auth (Without School)
exports.registerSchool = async (req, res) => {
  try {
    const { name, academicYear } = req.body;
    
    if (!name || !academicYear) {
      return res.status(400).json({ success: false, message: 'Name and Academic Year are required' });
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    let isUnique = false;
    while (!isUnique) {
      const { data } = await supabase.from('schools').select('id').eq('join_code', joinCode).maybeSingle();
      if (!data) isUnique = true;
      else joinCode = generateJoinCode();
    }

    // Create the school
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .insert({
        name,
        academic_year: academicYear,
        join_code: joinCode,
      })
      .select()
      .single();

    if (schoolErr) throw schoolErr;

    // Update or recreate the user's profile to link to this school AND make them a principal
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ 
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        school_id: school.id, 
        role: 'principal' 
      });

    if (profileErr) throw profileErr;

    res.status(201).json({ success: true, data: school, message: 'School created successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join an existing school using a Join Code
// @route   POST /api/schools/join
// @access  Auth (Without School)
exports.joinSchool = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({ success: false, message: 'Join Code is required' });
    }

    // Find school by join code
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .maybeSingle();

    if (schoolErr) throw schoolErr;
    if (!school) {
      return res.status(404).json({ success: false, message: 'Invalid Join Code. School not found.' });
    }

    // Update or recreate the user's profile to link to this school
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ 
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        school_id: school.id,
        role: req.user.role || 'teacher'
      });

    if (profileErr) throw profileErr;

    res.json({ success: true, data: school, message: 'Successfully joined the school!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get school info for current user
// @route   GET /api/schools
// @access  Auth
exports.getSchool = async (req, res) => {
  try {
    if (!req.user.schoolId) {
      return res.json({ success: true, data: null, message: 'No school configured' });
    }

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', req.user.schoolId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update school info
// @route   PUT /api/schools
// @access  Principal
exports.updateSchool = async (req, res) => {
  try {
    if (!req.user.schoolId) return res.status(400).json({ success: false, message: 'No school configured' });

    const { name, address, phone, email, academicYear, academicYearStart, academicYearEnd } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (academicYear !== undefined) updateData.academic_year = academicYear;
    if (academicYearStart !== undefined) updateData.academic_year_start = academicYearStart || null;
    if (academicYearEnd !== undefined) updateData.academic_year_end = academicYearEnd || null;

    const { data, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update school logo URL
// @route   POST /api/schools/logo
// @access  Principal
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.user.schoolId) return res.status(400).json({ success: false, message: 'No school configured' });

    const { logoUrl } = req.body;
    if (!logoUrl) return res.status(400).json({ success: false, message: 'logoUrl is required' });

    const { data, error } = await supabase
      .from('schools')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
