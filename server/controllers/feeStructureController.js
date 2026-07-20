const { sql } = require('../config/database');

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Auth
exports.getFeeStructures = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    let query = 'SELECT * FROM fee_structures WHERE 1=1';
    const request = req.db.request();

    if (academicYear) {
      query += ' AND academic_year = @academicYear';
      request.input('academicYear', sql.NVarChar, academicYear);
    }
    if (grade) {
      query += ' AND grade = @grade';
      request.input('grade', sql.NVarChar, grade);
    }
    
    query += ' ORDER BY grade ASC';

    const result = await request.query(query);

    // Parse the JSON fee_heads back into objects for the frontend
    const data = result.recordset.map(row => {
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
    const existing = await req.db.request()
      .input('academicYear', sql.NVarChar, academicYear)
      .input('grade', sql.NVarChar, grade)
      .query('SELECT id FROM fee_structures WHERE academic_year = @academicYear AND grade = @grade');

    if (existing.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fee structure already exists for Grade ${grade}, Year ${academicYear}`,
      });
    }

    const totalStandardFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    const feeHeadsJson = JSON.stringify(feeHeads);

    const result = await req.db.request()
      .input('academicYear', sql.NVarChar, academicYear)
      .input('grade', sql.NVarChar, grade)
      .input('feeHeads', sql.NVarChar, feeHeadsJson)
      .input('totalStandardFee', sql.Decimal(12,2), totalStandardFee)
      .query(`
        INSERT INTO fee_structures (academic_year, grade, fee_heads, total_standard_fee)
        OUTPUT INSERTED.*
        VALUES (@academicYear, @grade, @feeHeads, @totalStandardFee)
      `);

    const newStructure = result.recordset[0];
    try {
      newStructure.fee_heads = JSON.parse(newStructure.fee_heads);
    } catch(e) { newStructure.fee_heads = []; }

    // Auto-assign fee to all active students in this grade
    let assignedCount = 0;
    try {
      const studentsResult = await req.db.request()
        .input('grade', sql.NVarChar, grade)
        .query('SELECT id FROM students WHERE grade = @grade AND is_active = 1');

      const students = studentsResult.recordset;

      if (students.length > 0) {
        const studentIds = students.map(s => s.id);
        
        // This is safe from SQL injection because we generate the parameters securely
        const idsList = studentIds.map((_, i) => `@id${i}`).join(',');
        
        const existingFeesReq = req.db.request();
        existingFeesReq.input('academicYear', sql.NVarChar, academicYear);
        studentIds.forEach((id, i) => existingFeesReq.input(`id${i}`, sql.UniqueIdentifier, id));

        const existingFeesResult = await existingFeesReq.query(`
          SELECT student_id FROM fee_collections 
          WHERE academic_year = @academicYear AND student_id IN (${idsList})
        `);

        const existingIds = new Set(existingFeesResult.recordset.map(e => e.student_id));
        
        const newRecords = students
          .filter(s => !existingIds.has(s.id))
          .map(s => ({ student_id: s.id }));

        if (newRecords.length > 0) {
          // Batch insert
          const insertReq = req.db.request();
          insertReq.input('academicYear', sql.NVarChar, academicYear);
          insertReq.input('committedFee', sql.Decimal(12,2), totalStandardFee);
          insertReq.input('feeBreakdown', sql.NVarChar, feeHeadsJson);
          
          let valuesArr = [];
          newRecords.forEach((r, i) => {
            insertReq.input(`sid${i}`, sql.UniqueIdentifier, r.student_id);
            valuesArr.push(`(@sid${i}, @academicYear, @committedFee, @feeBreakdown, @committedFee, 'pending')`);
          });
          
          await insertReq.query(`
            INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
            VALUES ${valuesArr.join(', ')}
          `);
          
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

    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('feeHeads', sql.NVarChar, feeHeadsJson)
      .input('totalStandardFee', sql.Decimal(12,2), totalStandardFee)
      .query(`
        UPDATE fee_structures 
        SET fee_heads = @feeHeads, total_standard_fee = @totalStandardFee
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    const updated = result.recordset[0];
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
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM fee_structures WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
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
    const structResult = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM fee_structures WHERE id = @id');

    if (structResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    const structure = structResult.recordset[0];

    // Get all active students in this grade
    const studentsResult = await req.db.request()
      .input('grade', sql.NVarChar, structure.grade)
      .query('SELECT id FROM students WHERE grade = @grade AND is_active = 1');

    const students = studentsResult.recordset;

    if (students.length === 0) {
      return res.json({ success: true, assignedCount: 0, message: 'No active students in this grade' });
    }

    const studentIds = students.map(s => s.id);
    const idsList = studentIds.map((_, i) => `@id${i}`).join(',');

    const existingFeesReq = req.db.request();
    existingFeesReq.input('academicYear', sql.NVarChar, structure.academic_year);
    studentIds.forEach((id, i) => existingFeesReq.input(`id${i}`, sql.UniqueIdentifier, id));

    const existingFeesResult = await existingFeesReq.query(`
      SELECT student_id FROM fee_collections 
      WHERE academic_year = @academicYear AND student_id IN (${idsList})
    `);

    const existingIds = new Set(existingFeesResult.recordset.map(e => e.student_id));
    const newRecords = students.filter(s => !existingIds.has(s.id));

    if (newRecords.length > 0) {
      const insertReq = req.db.request();
      insertReq.input('academicYear', sql.NVarChar, structure.academic_year);
      insertReq.input('committedFee', sql.Decimal(12,2), structure.total_standard_fee);
      insertReq.input('feeBreakdown', sql.NVarChar, structure.fee_heads);
      
      let valuesArr = [];
      newRecords.forEach((r, i) => {
        insertReq.input(`sid${i}`, sql.UniqueIdentifier, r.id);
        valuesArr.push(`(@sid${i}, @academicYear, @committedFee, @feeBreakdown, @committedFee, 'pending')`);
      });
      
      await insertReq.query(`
        INSERT INTO fee_collections (student_id, academic_year, committed_fee, fee_breakdown, balance, status)
        VALUES ${valuesArr.join(', ')}
      `);
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
