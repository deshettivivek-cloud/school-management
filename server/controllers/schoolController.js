const supabase = require('../config/supabase');
const crypto = require('crypto');

// Helper to generate a random 6-character join code
const generateJoinCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Onboarding methods (register/join) removed - SaaS model is Top-Down via Super Admin
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

// @desc    Get daily stats for dashboard
// @route   GET /api/schools/daily-stats
// @access  Auth
exports.getDailyStats = async (req, res) => {
  try {
    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, message: 'No school configured' });
    }

    const { date } = req.query; // optional date string (YYYY-MM-DD), defaults to today
    let targetDateStr = '';
    
    if (date) {
      targetDateStr = date;
    } else {
      // Get current date in IST or server timezone (approximate YYYY-MM-DD)
      targetDateStr = new Date().toISOString().split('T')[0];
    }

    // 1. Fetch fees (optimized: only fetch collections updated on or after target date)
    const { data: collections, error: feeErr } = await supabase
      .from('fee_collections')
      .select('payments')
      .eq('school_id', req.user.schoolId)
      .gte('updated_at', targetDateStr);
    
    if (feeErr) throw feeErr;

    let totalCollection = 0;
    if (collections) {
      collections.forEach(c => {
        if (c.payments && Array.isArray(c.payments)) {
          c.payments.forEach(p => {
            if (p.date && p.date.startsWith(targetDateStr)) {
              totalCollection += (p.amount || 0);
            }
          });
        }
      });
    }

    // 2. Fetch expenditures
    const targetDateObj = new Date(targetDateStr);
    targetDateObj.setDate(targetDateObj.getDate() + 1);
    const nextDateStr = targetDateObj.toISOString().split('T')[0];

    const { data: expenditures, error: expErr } = await supabase
      .from('expenditures')
      .select('amount, date')
      .eq('school_id', req.user.schoolId)
      .gte('date', targetDateStr)
      .lt('date', nextDateStr);

    if (expErr) throw expErr;

    let totalExpenditure = 0;
    if (expenditures) {
      expenditures.forEach(e => {
        totalExpenditure += (e.amount || 0);
      });
    }

    const profitLoss = totalCollection - totalExpenditure;

    res.json({
      success: true,
      data: {
        date: targetDateStr,
        totalCollection,
        totalExpenditure,
        profitLoss
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
