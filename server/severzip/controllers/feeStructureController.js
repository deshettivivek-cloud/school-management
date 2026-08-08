const crypto = require('crypto');
const { logAuditAction } = require('../utils/auditLogger');

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Auth
exports.getFeeStructures = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = 'SELECT * FROM fee_structures WHERE deleted_at IS NULL';
    let params = [];

    if (academicYear) {
      query += ' AND academic_year = ?';
      params.push(academicYear);
    }
    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }
    
    query += ' ORDER BY grade ASC';

    const [rows] = await req.db.execute(query, params);

    // Parse the JSON fee_heads back into objects for the frontend
    const data = rows.map(row => {
      try {
        row.fee_heads = JSON.parse(row.fee_heads);
      } catch (e) {
        row.fee_heads = [];
      }
      return row;
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Admin
exports.createFeeStructure = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { academicYear, grade, feeHeads } = req.body;

    // Check if already exists
    const [existing] = await connection.execute(
      'SELECT id FROM fee_structures WHERE academic_year = ? AND grade = ? AND deleted_at IS NULL',
      [academicYear, grade]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Fee structure already exists for Grade ${grade}, Year ${academicYear}`,
      });
    }

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    const feeHeadsJson = JSON.stringify(feeHeads);
    const newStructId = crypto.randomUUID();

    await connection.execute(`
        INSERT INTO fee_structures (id, academic_year, grade, fee_heads, total_standard_fee)
        VALUES (?, ?, ?, ?, ?)
      `, [newStructId, academicYear, grade, feeHeadsJson, totalStandardFee]);

    const [newStructs] = await connection.execute('SELECT * FROM fee_structures WHERE id = ?', [newStructId]);
    const newStructure = newStructs[0];
    
    try {
      newStructure.fee_heads = JSON.parse(newStructure.fee_heads);
    } catch(e) { newStructure.fee_heads = []; }

    // Auto-assign fee to all active students in this grade
    let assignedCount = 0;
    const [students] = await connection.execute('SELECT id FROM students WHERE grade = ? AND is_active = 1 AND deleted_at IS NULL', [grade]);

    if (students.length > 0) {
      const studentIds = students.map(s => s.id);
      const idsList = studentIds.map(() => '?').join(',');
      
      const [existingFees] = await connection.query(`
        SELECT student_id FROM fee_collections 
        WHERE academic_year = ? AND student_id IN (${idsList})
      `, [academicYear, ...studentIds]);

      const existingIds = new Set(existingFees.map(e => e.student_id));
      
      const newRecords = students
        .filter(s => !existingIds.has(s.id))
        .map(s => ({ student_id: s.id }));

      if (newRecords.length > 0) {
        let valuesArr = [];
        let params = [];
        newRecords.forEach((r) => {
          const fcId = crypto.randomUUID();
          valuesArr.push(`(?, ?, ?, ?, ?, ?, 'pending')`);
          params.push(fcId, r.student_id, academicYear, totalStandardFee, feeHeadsJson, totalStandardFee);
        });
        
        await connection.query(`
          INSERT INTO fee_collections (id, student_id, academic_year, committed_fee, fee_breakdown, balance, status)
          VALUES ${valuesArr.join(', ')}
        `, params);
        
        assignedCount = newRecords.length;
      }
    }

    await connection.commit();

    await logAuditAction(req, {
      action: 'CREATE_FEE_STRUCTURE',
      resource_type: 'fee_structure',
      resource_id: newStructure.id,
      new_values: { academicYear, grade, totalStandardFee }
    });

    res.status(201).json({ success: true, data: newStructure, assignedCount });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Admin
exports.updateFeeStructure = async (req, res) => {
  try {
    const { feeHeads } = req.body;

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    const feeHeadsJson = JSON.stringify(feeHeads);

    await req.db.execute(`
        UPDATE fee_structures 
        SET fee_heads = ?, total_standard_fee = ?
        WHERE id = ?
      `, [feeHeadsJson, totalStandardFee, req.params.id]);

    const [rows] = await req.db.execute('SELECT * FROM fee_structures WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    const updated = rows[0];
    try { updated.fee_heads = JSON.parse(updated.fee_heads); } catch(e) { updated.fee_heads = []; }

    await logAuditAction(req, {
      action: 'UPDATE_FEE_STRUCTURE',
      resource_type: 'fee_structure',
      resource_id: req.params.id,
      new_values: { totalStandardFee }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fees/structure/:id
// @access  Admin
exports.deleteFeeStructure = async (req, res) => {
  try {
    const [result] = await req.db.execute('UPDATE fee_structures SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    await logAuditAction(req, {
      action: 'DELETE_FEE_STRUCTURE',
      resource_type: 'fee_structure',
      resource_id: req.params.id
    });

    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply fee structure to all students in that grade (retroactive)
// @route   POST /api/fees/structure/:id/apply
// @access  Admin
exports.applyFeeToStudents = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the fee structure
    const [structs] = await connection.execute('SELECT * FROM fee_structures WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (structs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    const structure = structs[0];

    // Get all active students in this grade
    const [students] = await connection.execute('SELECT id FROM students WHERE grade = ? AND is_active = 1 AND deleted_at IS NULL', [structure.grade]);

    if (students.length === 0) {
      await connection.rollback();
      return res.json({ success: true, assignedCount: 0, message: 'No active students in this grade' });
    }

    const studentIds = students.map(s => s.id);
    const idsList = studentIds.map(() => '?').join(',');

    const [existingFees] = await connection.query(`
      SELECT student_id FROM fee_collections 
      WHERE academic_year = ? AND student_id IN (${idsList})
    `, [structure.academic_year, ...studentIds]);

    const existingIds = new Set(existingFees.map(e => e.student_id));
    const newRecords = students.filter(s => !existingIds.has(s.id));

    if (newRecords.length > 0) {
      let valuesArr = [];
      let params = [];
      newRecords.forEach((r) => {
        const fcId = crypto.randomUUID();
        valuesArr.push(`(?, ?, ?, ?, ?, ?, 'pending')`);
        params.push(fcId, r.id, structure.academic_year, structure.total_standard_fee, structure.fee_heads, structure.total_standard_fee);
      });
      
      await connection.query(`
        INSERT INTO fee_collections (id, student_id, academic_year, committed_fee, fee_breakdown, balance, status)
        VALUES ${valuesArr.join(', ')}
      `, params);
    }

    await connection.commit();

    res.json({
      success: true,
      assignedCount: newRecords.length,
      alreadyAssigned: existingIds.size,
      message: `Fees applied to ${newRecords.length} student(s). ${existingIds.size} already had fee records.`,
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
