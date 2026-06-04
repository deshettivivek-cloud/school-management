const supabase = require('../config/supabase');

// @desc    Get school info
// @route   GET /api/school
// @access  Auth
exports.getSchool = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('school')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      data: data || null,
      message: data ? undefined : 'No school configured yet',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update school info
// @route   PUT /api/school
// @access  Admin
exports.updateSchool = async (req, res) => {
  try {
    const { name, address, phone, email, academicYear, academicYearStart, academicYearEnd } =
      req.body;

    // Check if school exists
    const { data: existing } = await supabase
      .from('school')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;

    if (existing) {
      // Update
      const updateData = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (academicYear !== undefined) updateData.academic_year = academicYear;
      if (academicYearStart !== undefined) updateData.academic_year_start = academicYearStart;
      if (academicYearEnd !== undefined) updateData.academic_year_end = academicYearEnd;

      const { data, error } = await supabase
        .from('school')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('school')
        .insert({
          name,
          address: address || '',
          phone: phone || '',
          email: email || '',
          academic_year: academicYear,
          academic_year_start: academicYearStart || null,
          academic_year_end: academicYearEnd || null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update school logo URL (after frontend uploads to Supabase Storage)
// @route   POST /api/school/logo
// @access  Admin
exports.uploadLogo = async (req, res) => {
  try {
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'logoUrl is required',
      });
    }

    const { data: existing } = await supabase
      .from('school')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Please configure school details first',
      });
    }

    const { data, error } = await supabase
      .from('school')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
