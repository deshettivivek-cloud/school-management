const XLSX = require('xlsx');

const MAX_ROW_LIMIT = 2000;

/**
 * Generic spreadsheet parser for .xlsx, .xls, and .csv buffers.
 * Normalizes header names (lowercase, trimmed, underscores instead of spaces).
 * Enforces MAX_ROW_LIMIT (2000 rows).
 */
function parseSpreadsheet(fileBuffer) {
  let workbook;
  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  } catch (err) {
    throw new Error('Failed to parse spreadsheet file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Spreadsheet contains no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to JSON (array of objects using 1st row as headers)
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  if (rawRows.length === 0) {
    throw new Error('Spreadsheet is empty or contains no data rows.');
  }

  if (rawRows.length > MAX_ROW_LIMIT) {
    throw new Error(`File exceeds maximum allowed limit of ${MAX_ROW_LIMIT} rows. Found ${rawRows.length} rows. Please split your file into smaller batches.`);
  }

  // Normalize headers for each row
  const normalizedRows = rawRows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      const cleanKey = key
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      if (cleanKey) {
        let val = row[key];
        if (typeof val === 'string') {
          val = val.trim();
        }
        normalized[cleanKey] = val;
      }
    });
    return normalized;
  });

  const headers = Object.keys(normalizedRows[0] || {});

  return {
    headers,
    rows: normalizedRows,
    totalCount: normalizedRows.length,
  };
}

/**
 * Generic row validation function for any entity import.
 * @param {Array} rows - Normalized row objects
 * @param {Object} schema - Zod schema for single entity row
 * @param {Function} [dedupeCheckFn] - Async function (rows) => Set/Map of existing unique values in DB
 * @param {string} [uniqueKey] - Field name to check for duplicates (e.g. 'admission_no')
 */
async function validateRows(rows, schema, dedupeCheckFn = null, uniqueKey = null) {
  const validRows = [];
  const invalidRows = [];
  const seenInFile = new Set();

  let dbDuplicates = new Set();
  if (dedupeCheckFn && uniqueKey) {
    const keysToCheck = rows
      .map((r) => r[uniqueKey])
      .filter((k) => k !== undefined && k !== null && k !== '');
    if (keysToCheck.length > 0) {
      dbDuplicates = await dedupeCheckFn(keysToCheck);
    }
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header
    const errors = [];

    // Check duplicate within the uploaded file
    if (uniqueKey && row[uniqueKey]) {
      const keyValue = String(row[uniqueKey]).toLowerCase();
      if (seenInFile.has(keyValue)) {
        errors.push(`Duplicate ${uniqueKey} "${row[uniqueKey]}" within the uploaded file.`);
      } else {
        seenInFile.add(keyValue);
      }

      // Check duplicate against DB
      if (dbDuplicates.has(keyValue)) {
        errors.push(`${uniqueKey} "${row[uniqueKey]}" already exists in the database.`);
      }
    }

    // Validate against Zod schema
    const parseResult = schema.safeParse(row);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || parseResult.error.errors || [];
      issues.forEach((err) => {
        const fieldName = err.path.join('.') || 'row';
        errors.push(`${fieldName}: ${err.message}`);
      });
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        row,
        errors,
      });
    } else {
      validRows.push({
        rowNumber,
        data: parseResult.data,
      });
    }
  });

  return {
    validRows,
    invalidRows,
    summary: {
      totalCount: rows.length,
      validCount: validRows.length,
      errorCount: invalidRows.length,
    },
  };
}

module.exports = {
  MAX_ROW_LIMIT,
  parseSpreadsheet,
  validateRows,
};
