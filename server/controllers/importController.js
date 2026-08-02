const XLSX = require('xlsx');
const { parseSpreadsheet, validateRows } = require('../services/importService');
const { studentRowSchema } = require('../validators/studentImportSchema');
const { findExistingAdmissionNumbers, bulkInsertStudentsWithFeeCollections } = require('../repositories/studentImportRepository');
const { employeeRowSchema } = require('../validators/employeeImportSchema');
const { findExistingEmployeeIds, bulkInsertEmployees } = require('../repositories/employeeImportRepository');
const { logAuditAction } = require('../utils/auditLogger');

/**
 * Downloads a sample Excel template for student bulk import.
 * GET /api/import/students/template
 */
const downloadStudentTemplate = (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();

    const templateData = [
      {
        admission_no: 'ADM-2026-001',
        name: 'John Doe',
        dob: '2015-05-15',
        gender: 'male',
        grade: '10',
        section: 'A',
        parent_name: 'Robert Doe',
        parent_phone: '9876543210',
        academic_year: '2025-2026',
        aadhar_no: '123456789012',
        caste: 'General',
        address: '123 Main Street, City',
      },
      {
        admission_no: 'ADM-2026-002',
        name: 'Jane Smith',
        dob: '2016-08-20',
        gender: 'female',
        grade: '10',
        section: 'B',
        parent_name: 'David Smith',
        parent_phone: '9876543211',
        academic_year: '2025-2026',
        aadhar_no: '987654321098',
        caste: 'General',
        address: '456 Park Avenue, City',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 15 }, // admission_no
      { wch: 20 }, // name
      { wch: 12 }, // dob
      { wch: 10 }, // gender
      { wch: 10 }, // grade
      { wch: 10 }, // section
      { wch: 20 }, // parent_name
      { wch: 15 }, // parent_phone
      { wch: 15 }, // academic_year
      { wch: 15 }, // aadhar_no
      { wch: 15 }, // caste
      { wch: 30 }, // address
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

/**
 * Previews uploaded student spreadsheet: parses and validates rows without DB write.
 * POST /api/import/students/preview
 */
const previewStudentImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded' });
    }

    // Parse spreadsheet buffer
    const { headers, rows } = parseSpreadsheet(req.file.buffer);

    // Validate rows against Zod schema & DB unique checks
    const validationResult = await validateRows(
      rows,
      studentRowSchema,
      async (admissionNos) => findExistingAdmissionNumbers(req.db, admissionNos),
      'admission_no'
    );

    return res.json({
      success: true,
      headers,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      summary: validationResult.summary,
    });
  } catch (error) {
    if (error.message.includes('exceeds maximum allowed limit') || error.message.includes('Failed to parse') || error.message.includes('empty')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Commits pre-validated valid student rows into database in a single transaction.
 * POST /api/import/students/commit
 */
const commitStudentImport = async (req, res, next) => {
  try {
    const { validRows } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows provided for import' });
    }

    // Re-extract data objects if passed wrapped in { rowNumber, data }
    const rawDataObjects = validRows.map((item) => item.data || item);

    // SERVER-SIDE RE-VALIDATION: Do not blindly trust client payload!
    const revalidation = await validateRows(
      rawDataObjects,
      studentRowSchema,
      async (admissionNos) => findExistingAdmissionNumbers(req.db, admissionNos),
      'admission_no'
    );

    if (revalidation.invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Server-side re-validation failed. Some rows contain duplicate or invalid data.',
        invalidRows: revalidation.invalidRows,
      });
    }

    // Execute bulk insert & auto fee collection assignment in single transaction
    const insertedStudents = await bulkInsertStudentsWithFeeCollections(req.db, revalidation.validRows);

    // Log ONE audit action for the entire batch import
    await logAuditAction(req, {
      action: 'BULK_IMPORT_STUDENTS',
      resource_type: 'student',
      resource_id: 'batch',
      new_values: { count: insertedStudents.length },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedStudents.length} students.`,
      count: insertedStudents.length,
      data: insertedStudents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Downloads a sample Excel template for employee bulk import.
 * GET /api/import/employees/template
 */
const downloadEmployeeTemplate = (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();

    const templateData = [
      {
        emp_id: 'EMP-001',
        name: 'Sarah Connor',
        department: 'Science',
        designation: 'Senior Teacher',
        gender: 'female',
        dob: '1985-04-12',
        joining_date: '2020-06-01',
        basic_salary: 45000,
        phone: '9876543220',
        email: 'sarah.c@school.edu',
        address: '101 Faculty Housing',
      },
      {
        emp_id: 'EMP-002',
        name: 'John Smith',
        department: 'Administration',
        designation: 'Clerk',
        gender: 'male',
        dob: '1990-08-25',
        joining_date: '2022-01-15',
        basic_salary: 25000,
        phone: '9876543221',
        email: 'john.s@school.edu',
        address: '202 Staff Quarters',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 15 }, // emp_id
      { wch: 20 }, // name
      { wch: 15 }, // department
      { wch: 15 }, // designation
      { wch: 10 }, // gender
      { wch: 12 }, // dob
      { wch: 15 }, // joining_date
      { wch: 15 }, // basic_salary
      { wch: 15 }, // phone
      { wch: 25 }, // email
      { wch: 30 }, // address
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees_Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

/**
 * Previews uploaded employee spreadsheet.
 * POST /api/import/employees/preview
 */
const previewEmployeeImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded' });
    }

    const { headers, rows } = parseSpreadsheet(req.file.buffer);

    const validationResult = await validateRows(
      rows,
      employeeRowSchema,
      async (empIds) => findExistingEmployeeIds(req.db, empIds),
      'emp_id'
    );

    return res.json({
      success: true,
      headers,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      summary: validationResult.summary,
    });
  } catch (error) {
    if (error.message.includes('exceeds maximum allowed limit') || error.message.includes('Failed to parse') || error.message.includes('empty')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Commits pre-validated employee rows into database.
 * POST /api/import/employees/commit
 */
const commitEmployeeImport = async (req, res, next) => {
  try {
    const { validRows } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows provided for import' });
    }

    const rawDataObjects = validRows.map((item) => item.data || item);

    const revalidation = await validateRows(
      rawDataObjects,
      employeeRowSchema,
      async (empIds) => findExistingEmployeeIds(req.db, empIds),
      'emp_id'
    );

    if (revalidation.invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Server-side re-validation failed. Some rows contain duplicate or invalid data.',
        invalidRows: revalidation.invalidRows,
      });
    }

    const insertedEmployees = await bulkInsertEmployees(req.db, revalidation.validRows);

    await logAuditAction(req, {
      action: 'BULK_IMPORT_EMPLOYEES',
      resource_type: 'employee',
      resource_id: 'batch',
      new_values: { count: insertedEmployees.length },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedEmployees.length} employees.`,
      count: insertedEmployees.length,
      data: insertedEmployees,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadStudentTemplate,
  previewStudentImport,
  commitStudentImport,
  downloadEmployeeTemplate,
  previewEmployeeImport,
  commitEmployeeImport
};
