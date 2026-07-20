const { sql } = require('../config/database');

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
      WHERE 1=1
    `;
    const request = req.db.request();

    if (startDate) {
      query += ' AND e.date >= @startDate';
      request.input('startDate', sql.Date, startDate);
    }
    if (endDate) {
      query += ' AND e.date <= @endDate';
      request.input('endDate', sql.Date, endDate);
    }
    if (category) {
      query += ' AND e.category = @category';
      request.input('category', sql.NVarChar, category);
    }
    if (academicYear) {
      query += ' AND e.academic_year = @academicYear';
      request.input('academicYear', sql.NVarChar, academicYear);
    }
    if (search) {
      query += ' AND (e.title LIKE @search OR e.vendor_name LIKE @search OR e.description LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const result = await request.query(query);

    const formattedData = result.recordset.map(row => {
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
  try {
    const { title, amount, category, date, description, payment_mode, vendor_name, academic_year } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const result = await req.db.request()
      .input('title', sql.NVarChar, title)
      .input('amount', sql.Decimal(12,2), amount)
      .input('category', sql.NVarChar, category || 'other')
      .input('date', sql.Date, date || new Date().toISOString().split('T')[0])
      .input('description', sql.NVarChar, description || '')
      .input('paymentMode', sql.NVarChar, payment_mode || 'cash')
      .input('vendorName', sql.NVarChar, vendor_name || '')
      .input('academicYear', sql.NVarChar, academic_year || '')
      .input('createdBy', sql.UniqueIdentifier, req.user.id)
      .query(`
        INSERT INTO expenditures (
          title, amount, category, date, description, payment_mode, 
          vendor_name, academic_year, created_by
        )
        OUTPUT INSERTED.*
        VALUES (
          @title, @amount, @category, @date, @description, @paymentMode,
          @vendorName, @academicYear, @createdBy
        )
      `);

    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error creating expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to create expenditure' });
  }
};

// @desc    Get single expenditure
// @route   GET /api/expenditures/:id
// @access  Auth
exports.getExpenditure = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT e.*, p.name as created_by_name 
        FROM expenditures e
        LEFT JOIN profiles p ON e.created_by = p.id
        WHERE e.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    const data = { ...result.recordset[0] };
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
  try {
    const fields = [
      'title', 'amount', 'category', 'date', 'description', 
      'payment_mode', 'vendor_name', 'academic_year'
    ];
    
    // Map API fields to DB columns if different
    const dbFields = { payment_mode: 'payment_mode', vendor_name: 'vendor_name', academic_year: 'academic_year' };
    
    let setClauses = [];
    const request = req.db.request();

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbCol = dbFields[field] || field;
        setClauses.push(`${dbCol} = @${field}`);
        
        if (field === 'date') {
          request.input(field, sql.Date, req.body[field]);
        } else if (field === 'amount') {
          request.input(field, sql.Decimal(12,2), req.body[field]);
        } else {
          request.input(field, sql.NVarChar, req.body[field]);
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    setClauses.push('updated_at = SYSDATETIMEOFFSET()');
    request.input('id', sql.UniqueIdentifier, req.params.id);
    
    const result = await request.query(`
      UPDATE expenditures 
      SET ${setClauses.join(', ')} 
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error updating expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to update expenditure' });
  }
};

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
// @access  Auth (Admin, Principal)
exports.deleteExpenditure = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM expenditures WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Expenditure not found' });
    }

    res.json({ success: true, message: 'Expenditure deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expenditure' });
  }
};
