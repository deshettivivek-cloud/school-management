// Helper: generate receipt number
const generateReceiptNo = async (db, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `REC-${yearCode}`;

  const [rows] = await db.query('SELECT payments FROM fee_collections WHERE academic_year = ?', [academicYear]);

  let maxSeq = 0;
  rows.forEach((fc) => {
    let payments = [];
    try {
      payments = JSON.parse(fc.payments || '[]');
    } catch(e) {}
    
    payments.forEach((p) => {
      if (p.receiptNo && p.receiptNo.startsWith(prefix)) {
        const seq = parseInt(p.receiptNo.split('-').pop(), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
  });

  return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
};

// Helper: recalculate fee collection totals
const recalculate = (record) => {
  let payments = [];
  try {
    payments = typeof record.payments === 'string' ? JSON.parse(record.payments) : (record.payments || []);
  } catch(e) {}

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

    let query = `
      SELECT fc.*, 
             s.name as student_name, s.admission_no, s.grade, s.section, 
             s.parent_name, s.parent_phone
      FROM fee_collections fc
      JOIN students s ON fc.student_id = s.id
      WHERE 1=1
    `;
    let params = [];

    if (academicYear) {
      query += ' AND fc.academic_year = ?';
      params.push(academicYear);
    }
    if (status) {
      query += ' AND fc.status = ?';
      params.push(status);
    }
    if (grade) {
      query += ' AND s.grade = ?';
      params.push(grade);
    }

    query += ' ORDER BY fc.updated_at DESC';

    const [rows] = await req.db.query(query, params);

    const shaped = rows.map((d) => {
      // Parse JSON fields
      try { d.fee_breakdown = JSON.parse(d.fee_breakdown); } catch(e) { d.fee_breakdown = []; }
      try { d.payments = JSON.parse(d.payments); } catch(e) { d.payments = []; }
      
      // Structure student object
      d.student = {
        name: d.student_name,
        admission_no: d.admission_no,
        grade: d.grade,
        section: d.section,
        parent_name: d.parent_name,
        parent_phone: d.parent_phone
      };
      
      delete d.student_name;
      delete d.admission_no;
      delete d.grade;
      delete d.section;
      delete d.parent_name;
      delete d.parent_phone;
      
      return d;
    });

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

    let query = `
      SELECT fc.*, 
             s.name as student_name, s.admission_no, s.grade, s.section, 
             s.parent_name, s.parent_phone, s.photo_url
      FROM fee_collections fc
      JOIN students s ON fc.student_id = s.id
      WHERE fc.student_id = ?
    `;
    let params = [req.params.studentId];

    if (academicYear) {
      query += ' AND fc.academic_year = ?';
      params.push(academicYear);
    }

    const [rows] = await req.db.query(query, params);

    if (rows.length === 0) {
      return res.json({ success: true, data: null, message: 'No fee record found' });
    }

    const d = rows[0];
    try { d.fee_breakdown = JSON.parse(d.fee_breakdown); } catch(e) { d.fee_breakdown = []; }
    try { d.payments = JSON.parse(d.payments); } catch(e) { d.payments = []; }
    
    d.student = {
      name: d.student_name, admission_no: d.admission_no, grade: d.grade,
      section: d.section, parent_name: d.parent_name, parent_phone: d.parent_phone,
      photo_url: d.photo_url
    };
    
    delete d.student_name; delete d.admission_no; delete d.grade; delete d.section;
    delete d.parent_name; delete d.parent_phone; delete d.photo_url;

    res.json({ success: true, data: d });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all fee collections for a specific student (History)
// @route   GET /api/fees/history/:studentId
// @access  Auth
exports.getStudentFeeHistory = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM fee_collections WHERE student_id = ? ORDER BY academic_year DESC', [req.params.studentId]);

    const shaped = rows.map(d => {
      try { d.fee_breakdown = JSON.parse(d.fee_breakdown); } catch(e) { d.fee_breakdown = []; }
      try { d.payments = JSON.parse(d.payments); } catch(e) { d.payments = []; }
      return d;
    });

    res.json({ success: true, data: shaped });
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

    const [students] = await req.db.query('SELECT id, name, admission_no, grade, section, parent_name, parent_phone FROM students WHERE id = ?', [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const student = students[0];

    const [existingResult] = await req.db.query('SELECT * FROM fee_collections WHERE student_id = ? AND academic_year = ?', [studentId, academicYear]);

    const feeBreakdownJson = JSON.stringify(feeBreakdown || []);
    let data;

    if (existingResult.length > 0) {
      const existing = existingResult[0];
      const updated = { ...existing, committed_fee: committedFee };
      if (feeBreakdown) updated.fee_breakdown = feeBreakdownJson;
      const calcs = recalculate(updated);

      await req.db.query(`
          UPDATE fee_collections 
          SET committed_fee = ?, fee_breakdown = ?,
              total_paid = ?, balance = ?, status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [committedFee, feeBreakdownJson || existing.fee_breakdown, calcs.total_paid, calcs.balance, calcs.status, existing.id]);
        
      const [updatedRows] = await req.db.query('SELECT * FROM fee_collections WHERE id = ?', [existing.id]);
      data = updatedRows[0];
    } else {
      const crypto = require('crypto');
      const fcId = crypto.randomUUID();
      await req.db.query(`
          INSERT INTO fee_collections (id, student_id, academic_year, committed_fee, fee_breakdown, balance, status, total_paid, payments)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, '[]')
        `, [fcId, studentId, academicYear, committedFee, feeBreakdownJson, committedFee]);
        
      const [insertedRows] = await req.db.query('SELECT * FROM fee_collections WHERE id = ?', [fcId]);
      data = insertedRows[0];
    }

    try { data.fee_breakdown = JSON.parse(data.fee_breakdown); } catch(e) { data.fee_breakdown = []; }
    try { data.payments = JSON.parse(data.payments); } catch(e) { data.payments = []; }
    data.student = student;

    res.status(201).json({ success: true, data });
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

    const [collResult] = await req.db.query(`
        SELECT fc.*, s.name as student_name, s.parent_phone 
        FROM fee_collections fc
        JOIN students s ON fc.student_id = s.id
        WHERE fc.student_id = ? AND fc.academic_year = ?
      `, [studentId, academicYear]);

    if (collResult.length === 0) {
      return res.status(404).json({ success: false, message: 'No fee record found. Set committed fee first.' });
    }

    const collection = collResult[0];

    if (collection.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fee already fully paid' });
    }

    const receiptNo = await generateReceiptNo(req.db, academicYear);
    
    let existingPayments = [];
    try { existingPayments = JSON.parse(collection.payments || '[]'); } catch(e) {}

    const crypto = require('crypto');
    const newPayment = {
      _id: crypto.randomUUID(),
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      receiptNo,
      mode: mode || 'cash',
      remarks: remarks || '',
    };

    const updatedPayments = [...existingPayments, newPayment];
    collection.payments = JSON.stringify(updatedPayments); // For recalculate
    
    const calcs = recalculate(collection);

    await req.db.query(`
        UPDATE fee_collections 
        SET payments = ?, total_paid = ?, balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [JSON.stringify(updatedPayments), calcs.total_paid, calcs.balance, calcs.status, collection.id]);
      
    const [updatedRows] = await req.db.query('SELECT * FROM fee_collections WHERE id = ?', [collection.id]);
    const data = updatedRows[0];
    
    try { data.fee_breakdown = JSON.parse(data.fee_breakdown); } catch(e) { data.fee_breakdown = []; }
    try { data.payments = JSON.parse(data.payments); } catch(e) { data.payments = []; }

    // WhatsApp Notification
    if (collection.parent_phone) {
      const whatsappService = require('../services/whatsappService');
      // Send official template (Requires 'fee_receipt' approved in Meta)
      const components = [
        {
          type: "body",
          parameters: [
            { type: "text", text: collection.student_name },
            { type: "text", text: String(newPayment.amount) },
            { type: "text", text: newPayment.receiptNo },
            { type: "text", text: String(calcs.balance) }
          ]
        }
      ];
      whatsappService.sendTemplateMessage(collection.parent_phone, 'fee_receipt', 'en_US', components)
        .catch(err => console.error('Failed to send fee receipt:', err));
    }

    res.json({
      success: true,
      data: {
        collection: data,
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

    let query = `
      SELECT fc.*, 
             s.name as student_name, s.admission_no, s.grade, s.section, 
             s.parent_name, s.parent_phone
      FROM fee_collections fc
      JOIN students s ON fc.student_id = s.id
      WHERE fc.status IN ('pending', 'partial', 'overdue')
    `;
    let params = [];

    if (academicYear) {
      query += ' AND fc.academic_year = ?';
      params.push(academicYear);
    }
    if (grade) {
      query += ' AND s.grade = ?';
      params.push(grade);
    }

    query += ' ORDER BY fc.balance DESC';

    const [rows] = await req.db.query(query, params);

    const shaped = rows.map((d) => {
      try { d.fee_breakdown = JSON.parse(d.fee_breakdown); } catch(e) { d.fee_breakdown = []; }
      try { d.payments = JSON.parse(d.payments); } catch(e) { d.payments = []; }
      
      d.student = {
        name: d.student_name, admission_no: d.admission_no, grade: d.grade,
        section: d.section, parent_name: d.parent_name, parent_phone: d.parent_phone
      };
      
      delete d.student_name; delete d.admission_no; delete d.grade;
      delete d.section; delete d.parent_name; delete d.parent_phone;
      return d;
    });

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

    let query = 'SELECT committed_fee, total_paid, balance, status FROM fee_collections WHERE 1=1';
    let params = [];

    if (academicYear) {
      query += ' AND academic_year = ?';
      params.push(academicYear);
    }

    const [collections] = await req.db.query(query, params);

    const totalCommitted = collections.reduce((s, c) => s + (Number(c.committed_fee) || 0), 0);
    const totalCollected = collections.reduce((s, c) => s + (Number(c.total_paid) || 0), 0);
    const totalPending = collections.reduce((s, c) => s + (Number(c.balance) || 0), 0);

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
    const [rows] = await req.db.query(`
        SELECT fc.*, s.name as student_name, s.admission_no, s.grade, s.section, 
               s.parent_name, s.parent_phone, s.photo_url
        FROM fee_collections fc
        JOIN students s ON fc.student_id = s.id
        WHERE fc.id = ?
      `, [req.params.collectionId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const collection = rows[0];
    let payments = [];
    try { payments = JSON.parse(collection.payments || '[]'); } catch(e) {}

    const payment = payments.find((p) => p._id === req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: {
        student: {
          name: collection.student_name, admission_no: collection.admission_no,
          grade: collection.grade, section: collection.section,
          parent_name: collection.parent_name, parent_phone: collection.parent_phone,
          photo_url: collection.photo_url
        },
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

// @desc    Send Fee Reminders (Bulk)
// @route   POST /api/fees/reminders
// @access  Auth
exports.sendFeeReminders = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of student IDs' });
    }

    const placeholders = studentIds.map(() => '?').join(',');
    // We only need student details and their current balance
    const [rows] = await req.db.query(`
      SELECT s.id, s.name, s.parent_phone, fc.balance 
      FROM students s
      JOIN fee_collections fc ON s.id = fc.student_id
      WHERE s.id IN (${placeholders}) AND fc.status IN ('pending', 'partial', 'overdue')
    `, studentIds);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid pending fee records found for the selected students' });
    }

    const whatsappService = require('../services/whatsappService');
    let successCount = 0;
    let failCount = 0;

    for (const student of rows) {
      if (student.parent_phone && student.balance > 0) {
        // template requires {name} and {balance}
        const components = [
          {
            type: "body",
            parameters: [
              { type: "text", text: student.name },
              { type: "text", text: String(student.balance) }
            ]
          }
        ];
        
        try {
          await whatsappService.sendTemplateMessage(student.parent_phone, 'fee_reminder', 'en_US', components);
          successCount++;
        } catch (err) {
          console.error(`Failed to send fee reminder to ${student.parent_phone}:`, err);
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Reminders processed. Sent: ${successCount}, Failed: ${failCount}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
