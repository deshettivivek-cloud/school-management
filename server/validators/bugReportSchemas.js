const { z } = require('zod');

const createBugReportSchema = z.object({
  title: z.string().trim().min(5, 'Title must be between 5 and 200 characters').max(200, 'Title must be between 5 and 200 characters'),
  description: z.string().trim().min(10, 'Description must be between 10 and 2000 characters').max(2000, 'Description must be between 10 and 2000 characters'),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  page_url: z.string().max(500).optional().nullable().transform(val => (val && val.trim()) ? val.trim() : null),
});

const updateBugReportStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'fixed', 'wont_fix']),
});

module.exports = {
  createBugReportSchema,
  updateBugReportStatusSchema,
};
