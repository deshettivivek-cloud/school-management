const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    console.warn(`[VALIDATION_FAILURE] Path: ${req.originalUrl} | IP: ${req.ip}`, JSON.stringify(result.error.errors));
    return res.status(400).json({
      success: false,
      message: 'Invalid input provided. Please check your details and try again.'
    });
  }

  req.body = result.data; // cleaned, type-coerced data
  next();
};

module.exports = validate;