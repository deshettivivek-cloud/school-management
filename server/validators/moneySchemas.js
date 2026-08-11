const { z } = require('zod');

const recordPaymentSchema = z.object({
  studentId: z.union([z.string(), z.number()]),
  academicYear: z.string().min(4).max(20),
  amount: z.coerce.number().positive(),
  mode: z.string().min(1).max(50).optional(),
  remarks: z.string().max(255).optional(),
});

const createExpenditureSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  category: z.string().max(100).optional(),
  date: z.string().optional(),
  description: z.string().max(1000).optional(),
  payment_mode: z.string().max(50).optional(),
  vendor_name: z.string().max(200).optional(),
  academic_year: z.string().max(20).optional(),
});

const updateExpenditureSchema = createExpenditureSchema.partial();

module.exports = { recordPaymentSchema, createExpenditureSchema, updateExpenditureSchema };