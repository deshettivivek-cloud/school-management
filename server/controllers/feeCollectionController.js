const supabase = require('../config/supabase');

// Helper: generate receipt number
const generateReceiptNo = async (schoolId, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `REC-${yearCode}`;

  const { data: collections } = await supabase
    .from('fee_collections')
    .select('payments')
    .eq('school_id', schoolId)
    .eq('academic_year', academicYear);

  let maxSeq = 0;
  if (collections) {
    collections.forEach((fc) => {
      const payments = fc.payments || [];
      payments.forEach((p) => {
        if (p.receiptNo && p.receiptNo.startsWith(prefix)) {
          const seq = parseInt(p.receiptNo.split('-').pop(), 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      });
    });
  }

  return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
};

// Helper: recalculate fee collection totals
const recalculate = (record) => {
  const payments = record.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = Math.max(0, record.committed_fee - totalPaid);

  let status = 'pending';
  if (balance <= 0) status = 'paid';
  else if (totalPaid > 0) status = 'partial';

  return { total_paid: totalPaid, balance, status };
};

// @desc    Get all fee collection records
// @route   GET /api/fees/collection
// @access  Auth
exports.getFeeCollections = async (req, res) => {
  try {
    const { academicYear, status, grade } = req.query;

    let query = supabase
      .from('fee_collections')
      .select('*, students!inner(name, admission_no, grade, section, parent_name, parent_phone)')
      .eq('school_id', req.user.schoolId);

    if (academicYear) query = query.eq('academic_year', academicYear);
    if (status) query = query.eq('status', status);
    if (grade) query = query.eq('students.grade', grade);

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Reshape to match frontend expectations
    const shaped = data.map((d) => ({
      ...d,
      student: d.students,
      students: undefined,
    }));

    res.json({ success: true, count: shaped.length, data: shaped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fee collection for a specific student
// @route   GET /api/fees/collection/:studentId
// @access  Auth
exports.getStudentFeeCollection = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let query = supabase
      .from('fee_collections')
      .select('*, students(name, admission_no, grade, section, parent_name, parent_phone, photo_url)')
      .eq('student_id', req.params.studentId)
      .eq('school_id', req.user.schoolId);

    if (academicYear) query = query.eq('academic_year', academicYear);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    if (!data) {
      return res.json({ success: true, data: null, message: 'No fee record found' });
    }

    res.json({
      success: true,
      data: { ...data, student: data.students, students: undefined },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set committed fee for a student
// @route   POST /api/fees/collection/commit
// @access  Admin
exports.commitFee = async (req, res) => {
  try {
    const { studentId, academicYear, committedFee, feeBreakdown } = req.body;

    // Verify student
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (sErr || !student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check existing
    const { data: existing } = await supabase
      .from('fee_collections')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', req.user.schoolId)
      .eq('academic_year', academicYear)
      .maybeSingle();

    let result;

    if (existing) {
      const updated = { ...existing, committed_fee: committedFee };
      if (feeBreakdown) updated.fee_breakdown = feeBreakdown;
      const calcs = recalculate(updated);

      const { data, error } = await supabase
        .from('fee_collections')
        .update({
          committed_fee: committedFee,
          fee_breakdown: feeBreakdown || existing.fee_breakdown,
          ...calcs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, students(name, admission_no, grade, section, parent_name, parent_phone)')
        .single();

      if (error) throw error;
      result = { ...data, student: data.students, students: undefined };
    } else {
      const { data, error } = await supabase
        .from('fee_collections')
        .insert({
          school_id: req.user.schoolId,
          student_id: studentId,
          academic_year: academicYear,
          committed_fee: committedFee,
          fee_breakdown: feeBreakdown || [],
          payments: [],
          total_paid: 0,
          balance: committedFee,
          status: 'pending',
        })
        .select('*, students(name, admission_no, grade, section, parent_name, parent_phone)')
        .single();

      if (error) throw error;
      result = { ...data, student: data.students, students: undefined };
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a payment
// @route   POST /api/fees/collection/pay
// @access  Auth
exports.recordPayment = async (req, res) => {
  try {
    const { studentId, academicYear, amount, mode, remarks } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be > 0' });
    }

    const { data: collection, error: fErr } = await supabase
      .from('fee_collections')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', req.user.schoolId)
      .eq('academic_year', academicYear)
      .single();

    if (fErr || !collection) {
      return res.status(404).json({ success: false, message: 'No fee record found. Set committed fee first.' });
    }

    if (collection.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fee already fully paid' });
    }

    const receiptNo = await generateReceiptNo(req.user.schoolId, academicYear);

    const newPayment = {
      _id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      receiptNo,
      mode: mode || 'cash',
      remarks: remarks || '',
    };

    const updatedPayments = [...(collection.payments || []), newPayment];
    const updated = { ...collection, payments: updatedPayments };
    const calcs = recalculate(updated);

    const { data, error } = await supabase
      .from('fee_collections')
      .update({
        payments: updatedPayments,
        ...calcs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collection.id)
      .select('*, students(name, admission_no, grade, section, parent_name, parent_phone, photo_url)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        collection: { ...data, student: data.students, students: undefined },
        payment: newPayment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending fees
// @route   GET /api/fees/pending
// @access  Auth
exports.getPendingFees = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = supabase
      .from('fee_collections')
      .select('*, students!inner(name, admission_no, grade, section, parent_name, parent_phone)')
      .in('status', ['pending', 'partial', 'overdue'])
      .eq('school_id', req.user.schoolId);

    if (academicYear) query = query.eq('academic_year', academicYear);
    if (grade) query = query.eq('students.grade', grade);

    query = query.order('balance', { ascending: false });

    console.log(`[DEBUG getPendingFees] schoolId: ${req.user.schoolId}, academicYear: ${academicYear}, grade: ${grade}`);
    const { data, error } = await query;
    console.log(`[DEBUG getPendingFees] data length: ${data ? data.length : 0}, error:`, error);
    if (error) throw error;

    const shaped = data.map((d) => ({
      ...d,
      student: d.students,
      students: undefined,
    }));

    const totalPending = shaped.reduce((sum, r) => sum + (r.balance || 0), 0);

    res.json({ success: true, count: shaped.length, totalPending, data: shaped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fee stats (for dashboard)
// @route   GET /api/fees/stats
// @access  Auth
exports.getFeeStats = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let query = supabase.from('fee_collections').select('*').eq('school_id', req.user.schoolId);
    if (academicYear) query = query.eq('academic_year', academicYear);

    const { data: collections, error } = await query;
    if (error) throw error;

    const totalCommitted = collections.reduce((s, c) => s + (c.committed_fee || 0), 0);
    const totalCollected = collections.reduce((s, c) => s + (c.total_paid || 0), 0);
    const totalPending = collections.reduce((s, c) => s + (c.balance || 0), 0);

    const paidCount = collections.filter((c) => c.status === 'paid').length;
    const partialCount = collections.filter((c) => c.status === 'partial').length;
    const pendingCount = collections.filter((c) => c.status === 'pending').length;
    const overdueCount = collections.filter((c) => c.status === 'overdue').length;

    res.json({
      success: true,
      data: {
        totalCommitted, totalCollected, totalPending,
        paidCount, partialCount, pendingCount, overdueCount,
        collectionRate: totalCommitted > 0 ? ((totalCollected / totalCommitted) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a specific receipt
// @route   GET /api/fees/receipt/:collectionId/:paymentId
// @access  Auth
exports.getReceipt = async (req, res) => {
  try {
    const { data: collection, error } = await supabase
      .from('fee_collections')
      .select('*, students(name, admission_no, grade, section, parent_name, parent_phone, photo_url)')
      .eq('id', req.params.collectionId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error || !collection) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const payments = collection.payments || [];
    const payment = payments.find((p) => p._id === req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: {
        student: collection.students,
        committedFee: collection.committed_fee,
        totalPaid: collection.total_paid,
        balance: collection.balance,
        payment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
