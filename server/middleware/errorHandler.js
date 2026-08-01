const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Always log server-side (not just in dev) so prod errors aren't silently lost
  console.error('❌ Error:', err);

  // MySQL: duplicate entry (unique constraint)
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'A record with this unique value already exists';
    error.statusCode = 409;
  }

  // MySQL: FK constraint fails on INSERT/UPDATE (parent row missing)
  if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Related resource not found';
    error.statusCode = 400;
  }

  // MySQL: FK constraint fails on DELETE/UPDATE (child rows still reference it)
  if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    error.message = 'Cannot delete — related records still exist';
    error.statusCode = 409;
  }

  // MySQL: required field missing
  if (err.code === 'ER_BAD_NULL_ERROR') {
    error.message = 'Missing required field';
    error.statusCode = 400;
  }

  // MySQL: data too long for column
  if (err.code === 'ER_DATA_TOO_LONG') {
    error.message = 'One of the fields exceeds the allowed length';
    error.statusCode = 400;
  }

  // MySQL: wrong data type / invalid value for column
  if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'ER_BAD_FIELD_ERROR') {
    error.message = 'Invalid value format';
    error.statusCode = 400;
  }

  // Never leak raw DB/internal error text to the client in prod
  const isKnownError = !!error.statusCode;
  const responseMessage = isKnownError
    ? error.message
    : (process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error');

  res.status(error.statusCode || 500).json({
    success: false,
    message: responseMessage,
  });
};

module.exports = errorHandler;