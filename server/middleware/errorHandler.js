const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for dev
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    error.message = 'Related resource not found or still in use';
    error.statusCode = 400;
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    error.message = 'A record with this unique value already exists';
    error.statusCode = 409;
  }

  // PostgreSQL invalid text representation (e.g., invalid UUID)
  if (err.code === '22P02') {
    error.message = 'Invalid resource ID format';
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
