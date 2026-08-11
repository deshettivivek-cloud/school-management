const { sendSMS } = require('../services/smsService');
const whatsappService = require('../services/whatsappService');
const feeRepository = require('../repositories/feeRepository');
const { logAuditAction } = require('../utils/auditLogger');

// Helper: generate receipt number
const generateReceiptNo = async (db, academicYear) => {
  const yearCode = academicYear.replace('-', '');
  const prefix = `REC-${yearCode}`;

  const rows = await feeRepository.getPaymentsByAcademicYear(db, academicYear);

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

    const rows = await feeRepository.findFeeCollections(req.db, { academicYear, status, grade });

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

    const rows = await feeRepository.findStudentFeeCollection(req.db, req.params.studentId, academicYear);

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
    const rows = await feeRepository.findFeeHistoryByStudent(req.db, req.params.studentId);

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
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { studentId, academicYear, committedFee, feeBreakdown } = req.body;

    const students = await feeRepository.findStudentById(connection, studentId);

    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const student = students[0];

    const existingResult = await feeRepository.findFeeCollectionByStudentAndYear(connection, studentId, academicYear);

    const feeBreakdownJson = JSON.stringify(feeBreakdown || []);
    let data;

    if (existingResult.length > 0) {
      const existing = existingResult[0];
      const updated = { ...existing, committed_fee: committedFee };
      if (feeBreakdown) updated.fee_breakdown = feeBreakdownJson;
      const calcs = recalculate(updated);

      await feeRepository.updateFeeCollection(connection, existing.id, {
        committedFee,
        feeBreakdownJson: feeBreakdownJson || existing.fee_breakdown,
        totalPaid: calcs.total_paid,
        balance: calcs.balance,
        status: calcs.status,
      });
        
      const updatedRows = await feeRepository.findFeeCollectionById(connection, existing.id);
      data = updatedRows[0];
    } else {
      const crypto = require('crypto');
      const fcId = crypto.randomUUID();
      await feeRepository.insertFeeCollection(connection, {
        id: fcId,
        studentId,
        academicYear,
        committedFee,
        feeBreakdownJson,
        balance: committedFee,
      });
        
      const insertedRows = await feeRepository.findFeeCollectionById(connection, fcId);
      data = insertedRows[0];
    }

    await connection.commit();

    await logAuditAction(req, {
      action: 'COMMIT_FEE',
      resource_type: 'fee_collection',
      resource_id: data.id,
      new_values: { committedFee, studentId, academicYear }
    });

    try { data.fee_breakdown = JSON.parse(data.fee_breakdown); } catch(e) { data.fee_breakdown = []; }
    try { data.payments = JSON.parse(data.payments); } catch(e) { data.payments = []; }
    data.student = student;

    res.status(201).json({ success: true, data });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Record a payment
// @route   POST /api/fees/collection/pay
// @access  Auth
exports.recordPayment = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { studentId, academicYear, amount, mode, remarks } = req.body;

    if (!amount || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Amount must be > 0' });
    }

    const collResult = await feeRepository.findFeeCollectionWithStudent(connection, studentId, academicYear);

    if (collResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'No fee record found. Set committed fee first.' });
    }

    const collection = collResult[0];

    if (collection.status === 'paid') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Fee already fully paid' });
    }

    const receiptNo = await generateReceiptNo(connection, academicYear);
    
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

    await feeRepository.updateFeeCollectionPayments(
      connection,
      collection.id,
      JSON.stringify(updatedPayments),
      calcs.total_paid,
      calcs.balance,
      calcs.status
    );
      
    const updatedRows = await feeRepository.findFeeCollectionById(connection, collection.id);
    const data = updatedRows[0];

    await connection.commit();

    await logAuditAction(req, {
      action: 'RECORD_PAYMENT',
      resource_type: 'fee_collection',
      resource_id: data.id,
      new_values: { amount: newPayment.amount, receiptNo: newPayment.receiptNo, mode: newPayment.mode }
    });
    
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
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get all pending fees
// @route   GET /api/fees/pending
// @access  Auth
exports.getPendingFees = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    const rows = await feeRepository.findPendingFees(req.db, { academicYear, grade });

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

    const collections = await feeRepository.getFeeStatsData(req.db, { academicYear });

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
    const rows = await feeRepository.findFeeCollectionDetailsById(req.db, req.params.collectionId);

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

    const rows = await feeRepository.findPendingFeeStudentsByIds(req.db, studentIds);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid pending fee records found for the selected students' });
    }

    const whatsappService = require('../services/whatsappService');
    let successCount = 0;
    let failCount = 0;

    for (const student of rows) {
      if (student.parent_phone && student.balance > 0) {
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

// @desc    Send fee receipt via SMS
// @route   POST /api/fees/send-sms-receipt
// @access  Auth
exports.sendSmsReceipt = async (req, res) => {
  try {
    const { studentId, amount, receiptNo, balance } = req.body;
    
    if (!studentId || !amount || !receiptNo) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const students = await feeRepository.findStudentContactById(req.db, studentId);
    
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const student = students[0];
    if (!student.parent_phone) {
      return res.status(400).json({ success: false, message: 'Parent phone number not available' });
    }

    const message = `STANCH SOFT APPLICATION- Dear ${student.name} Garu, Your Paid AMOUNT IS ${amount} Rs. and Receipt No.${receiptNo} -STANCH SOFT SOLUTIONS`;

    const result = await sendSMS(student.parent_phone, message);
    
    if (result.success) {
      res.json({ success: true, message: 'SMS receipt sent successfully' });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send fee receipt via WhatsApp
// @route   POST /api/fees/send-whatsapp-receipt
// @access  Auth
exports.sendWhatsappReceipt = async (req, res) => {
  try {
    const { studentId, amount, receiptNo, balance } = req.body;
    
    if (!studentId || !amount || !receiptNo) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const students = await feeRepository.findStudentContactById(req.db, studentId);
    
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const student = students[0];
    if (!student.parent_phone) {
      return res.status(400).json({ success: false, message: 'Parent phone number not available' });
    }

    const message = `Dear ${student.name} Garu,\n\nYour fee payment of ₹${amount} has been received successfully.\n\nReceipt No: ${receiptNo}\nBalance Amount: ₹${balance || 0}\n\nThank you.\nSchool Administration`;

    const result = await whatsappService.sendTextMessage(student.parent_phone, message);
    
    if (result.success) {
      res.json({ success: true, message: 'WhatsApp receipt sent successfully' });
    } else {
      res.status(500).json({ success: false, message: result.error || 'WhatsApp API failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
