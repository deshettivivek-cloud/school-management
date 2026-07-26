const crypto = require('crypto');

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Auth
exports.getFeeStructures = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = 'SELECT * FROM fee_structures WHERE 1=1';
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
  try {
    const { academicYear, grade, feeHeads } = req.body;

    // Check if already exists
    const [existing] = await req.db.execute(
      'SELECT id FROM fee_structures WHERE academic_year = ? AND grade = ?',
      [academicYear, grade]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fee structure already exists for Grade ${grade}, Year ${academicYear}`,
      });
    }

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    const feeHeadsJson = JSON.stringify(feeHeads);
    const newStructId = crypto.randomUUID();

    await req.db.execute(`
        INSERT INTO fee_structures (id, academic_year, grade, fee_heads, total_standard_fee)
        VALUES (?, ?, ?, ?, ?)
      `, [newStructId, academicYear, grade, feeHeadsJson, totalStandardFee]);

    const [newStructs] = await req.db.execute('SELECT * FROM fee_structures WHERE id = ?', [newStructId]);
    const newStructure = newStructs[0];
    
    try {
      newStructure.fee_heads = JSON.parse(newStructure.fee_heads);
    } catch(e) { newStructure.fee_heads = []; }

    // Auto-assign fee to all active students in this grade
    let assignedCount = 0;
    try {
      const [students] = await req.db.execute('SELECT id FROM students WHERE grade = ? AND is_active = 1', [grade]);

      if (students.length > 0) {
        const studentIds = students.map(s => s.id);
        const idsList = studentIds.map(() => '?').join(',');
        
        const [existingFees] = await req.db.query(`
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
          
          await req.db.query(`
            INSERT INTO fee_collections (id, student_id, academic_year, committed_fee, fee_breakdown, balance, status)
            VALUES ${valuesArr.join(', ')}
          `, params);
          
          assignedCount = newRecords.length;
        }
      }
    } catch (assignErr) {
      console.error('Auto-assign fee error (non-fatal):', assignErr.message);
    }

    res.status(201).json({ success: true, data: newStructure, assignedCount });
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
    const [result] = await req.db.execute('DELETE FROM fee_structures WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply fee structure to all students in that grade (retroactive)
// @route   POST /api/fees/structure/:id/apply
// @access  Admin
exports.applyFeeToStudents = async (req, res) => {
  try {
    // Get the fee structure
    const [structs] = await req.db.execute('SELECT * FROM fee_structures WHERE id = ?', [req.params.id]);

    if (structs.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    const structure = structs[0];

    // Get all active students in this grade
    const [students] = await req.db.execute('SELECT id FROM students WHERE grade = ? AND is_active = 1', [structure.grade]);

    if (students.length === 0) {
      return res.json({ success: true, assignedCount: 0, message: 'No active students in this grade' });
    }

    const studentIds = students.map(s => s.id);
    const idsList = studentIds.map(() => '?').join(',');

    const [existingFees] = await req.db.query(`
      SELECT student_id FROM fee_collections 
      WHERE academic_year = ? AND student_id IN (${idsList})
    `, [structure.academic_year, ...studentIds]);

    const existingIds = new Set(existingFees.map(e => e.student_id));
    const newRecords = students.filter(s => !existingIds.has(s.id));

    if (newRecords.length > 0) {
      let valuesArr = [];
      let params = [];
      newRecords.forEach((r) => {
        valuesArr.push(`(?, ?, ?, ?, ?, 'pending')`);
        params.push(r.id, structure.academic_year, structure.total_standard_fee, structure.fee_heads, structure.total_standard_fee);
      });
      
      await req.db.query(`
        INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
        VALUES ${valuesArr.join(', ')}
      `, params);
    }

    res.json({
      success: true,
      assignedCount: newRecords.length,
      alreadyAssigned: existingIds.size,
      message: `Fees applied to ${newRecords.length} student(s). ${existingIds.size} already had fee records.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
