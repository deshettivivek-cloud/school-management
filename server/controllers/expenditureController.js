const supabase = require('../config/supabase');

// @desc    Get all expenditures
// @route   GET /api/expenditures
// @access  Auth
exports.getExpenditures = async (req, res) => {
  try {
    const { category, startDate, endDate, academicYear } = req.query;

    let query = supabase
      .from('expenditures')
      .select('*')
      .eq('school_id', req.user.schoolId);

    if (category) query = query.eq('category', category);
    if (academicYear) query = query.eq('academic_year', academicYear);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single expenditure
// @route   GET /api/expenditures/:id
// @access  Auth
exports.getExpenditure = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenditures')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Expenditure not found' });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create expenditure
// @route   POST /api/expenditures
// @access  Auth
exports.createExpenditure = async (req, res) => {
  try {
    const { title, amount, category, date, description, paymentMode, vendorName, academicYear } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: 'Title, amount, category and date are required' });
    }

    const { data, error } = await supabase
      .from('expenditures')
      .insert({
        school_id: req.user.schoolId,
        title,
        amount: parseFloat(amount),
        category,
        date,
        description: description || '',
        payment_mode: paymentMode || 'cash',
        vendor_name: vendorName || '',
        academic_year: academicYear || '',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expenditure
// @route   PUT /api/expenditures/:id
// @access  Auth
exports.updateExpenditure = async (req, res) => {
  try {
    const { title, amount, category, date, description, paymentMode, vendorName, academicYear } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (description !== undefined) updateData.description = description;
    if (paymentMode !== undefined) updateData.payment_mode = paymentMode;
    if (vendorName !== undefined) updateData.vendor_name = vendorName;
    if (academicYear !== undefined) updateData.academic_year = academicYear;

    const { data, error } = await supabase
      .from('expenditures')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Expenditure not found' });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
// @access  Auth
exports.deleteExpenditure = async (req, res) => {
  try {
    const { error } = await supabase
      .from('expenditures')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId);

    if (error) throw error;

    res.json({ success: true, message: 'Expenditure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expenditure stats
// @route   GET /api/expenditures/stats
// @access  Auth
exports.getExpenditureStats = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let query = supabase.from('expenditures').select('*').eq('school_id', req.user.schoolId);
    if (academicYear) query = query.eq('academic_year', academicYear);

    const { data: expenditures, error } = await query;
    if (error) throw error;

    const totalExpenditure = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Category-wise breakdown
    const categoryMap = {};
    expenditures.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categoryWise = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly breakdown
    const monthMap = {};
    expenditures.forEach((e) => {
      const month = e.date ? e.date.substring(0, 7) : 'Unknown'; // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + e.amount;
    });
    const monthlyWise = Object.entries(monthMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        totalExpenditure,
        totalCount: expenditures.length,
        categoryWise,
        monthlyWise,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
