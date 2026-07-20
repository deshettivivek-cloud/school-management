const { sql, getMasterPool } = require('../config/database');

// @desc    Get school info for current user
// @route   GET /api/schools
// @access  Auth
exports.getSchool = async (req, res) => {
  try {
    if (!req.user.schoolId) {
      return res.json({ success: true, data: null, message: 'No school configured' });
    }

    const masterPool = await getMasterPool();
    const result = await masterPool.request()
      .input('id', sql.UniqueIdentifier, req.user.schoolId)
      .query('SELECT * FROM schools WHERE id = @id');

    res.json({
      success: true,
      data: result.recordset.length > 0 ? result.recordset[0] : null,
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

    const fields = ['name', 'address', 'phone', 'email', 'academic_year', 'academic_year_start', 'academic_year_end'];
    const dbFields = { academicYear: 'academic_year', academicYearStart: 'academic_year_start', academicYearEnd: 'academic_year_end' };
    
    let setClauses = [];
    const masterPool = await getMasterPool();
    const request = masterPool.request();

    Object.keys(req.body).forEach(field => {
      const dbCol = dbFields[field] || field;
      if (fields.includes(dbCol) && req.body[field] !== undefined) {
        setClauses.push(`${dbCol} = @${dbCol}`);
        if (dbCol.includes('date') || dbCol.includes('start') || dbCol.includes('end')) {
          request.input(dbCol, sql.Date, req.body[field] || null);
        } else {
          request.input(dbCol, sql.NVarChar, req.body[field] || '');
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    setClauses.push('updated_at = SYSDATETIMEOFFSET()');
    request.input('id', sql.UniqueIdentifier, req.user.schoolId);

    const queryStr = `
      UPDATE schools 
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    console.log('--- DEBUG QUERY ---');
    console.log(queryStr);
    console.log('--- DEBUG PARAMS ---');
    console.log(request.parameters);

    const result = await request.query(queryStr);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
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

    const masterPool = await getMasterPool();
    const result = await masterPool.request()
      .input('logoUrl', sql.NVarChar, logoUrl)
      .input('id', sql.UniqueIdentifier, req.user.schoolId)
      .query(`
        UPDATE schools 
        SET logo_url = @logoUrl, updated_at = SYSDATETIMEOFFSET()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get daily stats for dashboard
// @route   GET /api/schools/daily-stats
// @access  Auth
exports.getDailyStats = async (req, res) => {
  try {
    const { date } = req.query; // optional date string (YYYY-MM-DD), defaults to today
    let targetDateStr = date || new Date().toISOString().split('T')[0];

    // 1. Fetch fees (optimized: only fetch collections updated on or after target date)
    const collectionsResult = await req.db.request()
      .input('targetDate', sql.NVarChar, `${targetDateStr}%`)
      .query(`
        SELECT payments 
        FROM fee_collections 
        WHERE payments LIKE @targetDate
      `);
      
    // Wait, the above LIKE query might not catch JSON arrays correctly if it's not at the very start.
    // Better query: fetch all collections updated recently and filter in JS
    const recentCollectionsResult = await req.db.request()
      .input('targetDate', sql.NVarChar, targetDateStr)
      .query(`
        SELECT payments 
        FROM fee_collections 
        WHERE CONVERT(DATE, updated_at) >= @targetDate
      `);

    let totalCollection = 0;
    recentCollectionsResult.recordset.forEach(c => {
      if (c.payments) {
        let payments = [];
        try { payments = JSON.parse(c.payments); } catch(e) {}
        payments.forEach(p => {
          if (p.date && p.date.startsWith(targetDateStr)) {
            totalCollection += (Number(p.amount) || 0);
          }
        });
      }
    });

    // 2. Fetch expenditures
    const expResult = await req.db.request()
      .input('targetDate', sql.Date, targetDateStr)
      .query(`
        SELECT SUM(amount) as total 
        FROM expenditures 
        WHERE date = @targetDate
      `);

    const totalExpenditure = expResult.recordset[0].total || 0;
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
