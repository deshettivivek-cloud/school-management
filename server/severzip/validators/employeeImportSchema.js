const { z } = require('zod');

// Schema for parsing dates (Excel serial numbers or standard date strings)
const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'number') {
    // Excel date serial number to JS Date
    return new Date(Math.round((arg - 25569) * 86400 * 1000));
  }
  if (typeof arg === 'string') {
    const parsed = new Date(arg);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (arg instanceof Date) return arg;
  return undefined;
}, z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date format (use YYYY-MM-DD or Excel date format)',
}).optional());

const employeeRowSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  emp_id: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  
  gender: z.string().optional().transform(v => v ? v.toLowerCase() : v),
  dob: dateSchema,
  joining_date: dateSchema,
  
  basic_salary: z.preprocess((arg) => {
    if (typeof arg === 'string') return parseFloat(arg.replace(/[^0-9.-]+/g, ''));
    if (typeof arg === 'number') return arg;
    return undefined;
  }, z.number().nonnegative('Salary cannot be negative').optional().default(0)),
  
  phone: z.preprocess(
    (arg) => (arg ? String(arg).replace(/\D/g, '') : undefined),
    z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long').optional().or(z.literal(''))
  ),
  parent_phone: z.preprocess(
    (arg) => (arg ? String(arg).replace(/\D/g, '') : undefined),
    z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long').optional().or(z.literal(''))
  ),
  
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal(''))
}).transform((data) => {
  // Map parent_phone back to phone if phone is missing (due to global importService alias)
  if (!data.phone && data.parent_phone) {
    data.phone = data.parent_phone;
  }
  return data;
});

module.exports = {
  employeeRowSchema
};
