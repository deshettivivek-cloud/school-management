const supabase = require('../config/supabase');

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Auth
exports.getFeeStructures = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = supabase.from('fee_structures').select('*');
    if (academicYear) query = query.eq('academic_year', academicYear);
    if (grade) query = query.eq('grade', grade);
    query = query.order('grade', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Admin
exports.createFeeStructure = async (req, res) => {
  try {
    const { academicYear, grade, feeHeads } = req.body;

    // Check if already exists
    const { data: existing } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('academic_year', academicYear)
      .eq('grade', grade)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Fee structure already exists for Grade ${grade}, Year ${academicYear}`,
      });
    }

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

    const { data, error } = await supabase
      .from('fee_structures')
      .insert({
        academic_year: academicYear,
        grade,
        fee_heads: feeHeads,
        total_standard_fee: totalStandardFee,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Admin
exports.updateFeeStructure = async (req, res) => {
  try {
    const { feeHeads } = req.body;

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

    const { data, error } = await supabase
      .from('fee_structures')
      .update({ fee_heads: feeHeads, total_standard_fee: totalStandardFee })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fees/structure/:id
// @access  Admin
exports.deleteFeeStructure = async (req, res) => {
  try {
    const { error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
