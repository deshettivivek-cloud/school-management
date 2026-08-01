const crypto = require('crypto');

const { logAuditAction } = require('../utils/auditLogger');

// @desc    Get all expenditures
// @route   GET /api/expenditures
// @access  Auth (Admin, Principal, Clerk)
exports.getExpenditures = async (req, res) => {
  try {
    const { startDate, endDate, category, search, academicYear } = req.query;

    let query = `
      SELECT e.*, p.name as created_by_name 
      FROM expenditures e
      LEFT JOIN profiles p ON e.created_by = p.id
      WHERE e.deleted_at IS NULL
    `;
    let params = [];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    if (category) {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (academicYear) {
      query += ' AND e.academic_year = ?';
      params.push(academicYear);
    }
    if (search) {
      query += ' AND (e.title LIKE ? OR e.vendor_name LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const [rows] = await req.db.query(query, params);

    const formattedData = rows.map(row => {
      const data = { ...row };
      if (data.created_by_name) {
        data.created_by = { name: data.created_by_name };
      } else {
        data.created_by = null;
      }
      delete data.created_by_name;
      return data;
    });

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error getting expenditures:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenditures' });
  }
};

// @desc    Create expenditure
// @route   POST /api/expenditures
// @access  Auth (Admin, Principal, Clerk)
exports.createExpenditure = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, amount, category, date, description, payment_mode, vendor_name, academic_year } = req.body;

    if (!title || !amount) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const newExpId = crypto.randomUUID();

    await connection.query(`
        INSERT INTO expenditures (
          id, title, amount, category, date, description, payment_mode, 
          vendor_name, academic_year, created_by
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `, [
        newExpId, title, amount, category || 'other', date || new Date().toISOString().split('T')[0],
        description || '', payment_mode || 'cash', vendor_name || '', academic_year || '', req.user.id
      ]);

    const [rows] = await connection.query('SELECT * FROM expenditures WHERE id = ?', [newExpId]);

    await connection.commit();

    await logAuditAction(req, {
      action: 'CREATE_EXPENDITURE',
      resource_type: 'expenditure',
      resource_id: newExpId,
      new_values: { title, amount, category }
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to create expenditure' });
  } finally {
    connection.release();
  }
};

// @desc    Get single expenditure
// @route   GET /api/expenditures/:id
// @access  Auth
exports.getExpenditure = async (req, res) => {
  try {
    const [rows] = await req.db.query(`
        SELECT e.*, p.name as created_by_name 
        FROM expenditures e
        LEFT JOIN profiles p ON e.created_by = p.id
        WHERE e.id = ? AND e.deleted_at IS NULL
      `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    const data = { ...rows[0] };
    if (data.created_by_name) {
      data.created_by = { name: data.created_by_name };
    } else {
      data.created_by = null;
    }
    delete data.created_by_name;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenditure' });
  }
};

// @desc    Update expenditure
// @route   PUT /api/expenditures/:id
// @access  Auth (Admin, Principal, Clerk)
exports.updateExpenditure = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const fields = [
      'title', 'amount', 'category', 'date', 'description', 
      'payment_mode', 'vendor_name', 'academic_year'
    ];
    
    // Map API fields to DB columns if different
    const dbFields = { payment_mode: 'payment_mode', vendor_name: 'vendor_name', academic_year: 'academic_year' };
    
    let setClauses = [];
    let params = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbCol = dbFields[field] || field;
        setClauses.push(`${dbCol} = ?`);
        params.push(req.body[field]);
      }
    });

    if (setClauses.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(req.params.id);
    
    await connection.query(`
      UPDATE expenditures 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `, params);

    const [rows] = await connection.query('SELECT * FROM expenditures WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    await connection.commit();

    await logAuditAction(req, {
      action: 'UPDATE_EXPENDITURE',
      resource_type: 'expenditure',
      resource_id: req.params.id,
      new_values: rows[0]
    });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to update expenditure' });
  } finally {
    connection.release();
  }
};

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
// @access  Auth (Admin, Principal)
exports.deleteExpenditure = async (req, res) => {
  try {
    const [result] = await req.db.query('UPDATE expenditures SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    await logAuditAction(req, {
      action: 'DELETE_EXPENDITURE',
      resource_type: 'expenditure',
      resource_id: req.params.id
    });

    res.json({ success: true, message: 'Expenditure deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expenditure' });
  }
};

// @desc    Get expenditure stats
// @route   GET /api/expenditures/stats
// @access  Auth (Admin, Principal, Clerk)
exports.getExpenditureStats = async (req, res) => {
  try {
    const [rows] = await req.db.query(`
      SELECT 
        SUM(amount) as totalExpenditure,
        category,
        SUM(amount) as categoryTotal
      FROM expenditures
      WHERE deleted_at IS NULL
      GROUP BY category WITH ROLLUP
    `);

    let totalExpenditure = 0;
    const categoryBreakdown = [];

    rows.forEach(row => {
      if (row.category === null) {
        totalExpenditure = row.totalExpenditure || 0;
      } else {
        categoryBreakdown.push({
          category: row.category,
          amount: row.categoryTotal || 0
        });
      }
    });

    res.json({
      success: true,
      data: {
        totalExpenditure,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting expenditure stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenditure stats' });
  }
};
