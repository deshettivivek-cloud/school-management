const { getMasterPool } = require('../config/database');

// @desc    Get school info for current user
// @route   GET /api/schools
// @access  Auth
exports.getSchool = async (req, res) => {
  try {
    if (!req.user.tenantDb) {
      return res.json({ success: true, data: null, message: 'No school configured' });
    }

    const masterPool = await getMasterPool();
    const [rows] = await masterPool.execute('SELECT * FROM schools WHERE db_name = ?', [req.user.tenantDb]);

    res.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null,
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
    if (!req.user.tenantDb) return res.status(400).json({ success: false, message: 'No school configured' });

    if (req.body.phone && !/^\d{10}$/.test(String(req.body.phone).trim())) {
      return res.status(400).json({ success: false, message: '❌ School phone number must be exactly 10 digits' });
    }

    const fields = ['name', 'address', 'phone', 'email', 'academic_year', 'academic_year_start', 'academic_year_end'];
    const dbFields = { academicYear: 'academic_year', academicYearStart: 'academic_year_start', academicYearEnd: 'academic_year_end' };
    
    let setClauses = [];
    let values = [];

    Object.keys(req.body).forEach(field => {
      const dbCol = dbFields[field] || field;
      if (fields.includes(dbCol) && req.body[field] !== undefined) {
        setClauses.push(`${dbCol} = ?`);
        if (dbCol.includes('date') || dbCol.includes('start') || dbCol.includes('end')) {
          values.push(req.body[field] || null);
        } else {
          values.push(req.body[field] || '');
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add tenantDb to values for WHERE clause
    values.push(req.user.tenantDb);

    const masterPool = await getMasterPool();

    const queryStr = `
      UPDATE schools 
      SET ${setClauses.join(', ')}
      WHERE db_name = ?
    `;

    await masterPool.execute(queryStr, values);
    
    const [updated] = await masterPool.execute('SELECT * FROM schools WHERE db_name = ?', [req.user.tenantDb]);

    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update school logo URL
// @route   POST /api/schools/logo
// @access  Principal
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.user.tenantDb) return res.status(400).json({ success: false, message: 'No school configured' });

    const { logoUrl } = req.body;
    if (!logoUrl) return res.status(400).json({ success: false, message: 'logoUrl is required' });

    const masterPool = await getMasterPool();
    await masterPool.execute(
      `UPDATE schools SET logo_url = ? WHERE db_name = ?`,
      [logoUrl, req.user.tenantDb]
    );
    
    const [updated] = await masterPool.execute('SELECT * FROM schools WHERE db_name = ?', [req.user.tenantDb]);

    res.json({ success: true, data: updated[0] });
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

    // 1. Fetch fees updated on or after target date
    const [recentCollectionsResult] = await req.db.execute(`
      SELECT payments 
      FROM fee_collections 
      WHERE DATE(updated_at) >= ?
    `, [targetDateStr]);

    let totalCollection = 0;
    recentCollectionsResult.forEach(c => {
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
    const [expResult] = await req.db.execute(`
      SELECT SUM(amount) as total 
      FROM expenditures 
      WHERE date = ?
    `, [targetDateStr]);

    const totalExpenditure = expResult[0].total || 0;
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
