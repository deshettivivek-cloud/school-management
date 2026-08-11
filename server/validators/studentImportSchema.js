const { z } = require('zod');

const studentRowSchema = z.object({
  admission_no: z.coerce.string().trim().min(1, 'Admission number is required').max(50),
  name: z.string().trim().min(1, 'Student name is required').max(255),
  dob: z.string().trim().min(1, 'Date of birth is required').refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, { message: 'Invalid Date of Birth format (expected YYYY-MM-DD)' }),
  gender: z.string().trim().toLowerCase().refine((val) => ['male', 'female', 'other'].includes(val), {
    message: "Gender must be 'male', 'female', or 'other'",
  }),
  grade: z.coerce.string().trim().min(1, 'Grade is required').max(20),
  parent_name: z.string().trim().min(1, 'Parent name is required').max(255),
  parent_phone: z.coerce.string().trim().min(1, 'Parent phone number is required').max(20),
  academic_year: z.coerce.string().trim().min(4, 'Academic year is required').max(20),

  // Optional fields
  section: z.coerce.string().trim().max(10).optional().default(''),
  aadhar_no: z.coerce.string().trim().max(20).optional().default(''),
  pen_number: z.coerce.string().trim().max(50).optional().default(''),
  caste: z.string().trim().max(100).optional().default(''),
  sub_caste: z.string().trim().max(100).optional().default(''),
  mother_name: z.string().trim().max(255).optional().default(''),
  mother_tongue: z.string().trim().max(50).optional().default(''),
  mother_phone: z.coerce.string().trim().max(20).optional().default(''),
  guardian_phone: z.coerce.string().trim().max(20).optional().default(''),
  parent_email: z.string().trim().max(255).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  permanent_address: z.string().trim().max(500).optional().default(''),
  father_occupation: z.string().trim().max(100).optional().default(''),
  mother_occupation: z.string().trim().max(100).optional().default(''),
  father_occupation_desc: z.string().trim().max(255).optional().default(''),
  mother_occupation_desc: z.string().trim().max(255).optional().default(''),
  admission_status: z.string().trim().lowercase().optional().default('confirmed'),
});

module.exports = { studentRowSchema };
