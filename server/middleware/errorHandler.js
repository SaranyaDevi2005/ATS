/**
 * Central Error-Handling Middleware
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  // SQLite unique constraint error
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    const isEmail = err.message && err.message.includes('candidates.email');
    return res.status(409).json({
      error: isEmail 
        ? 'Candidate with this email already exists' 
        : 'Unique constraint violation',
    });
  }

  // SQLite foreign key constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (err.message && err.message.includes('FOREIGN KEY constraint failed'))) {
    return res.status(400).json({
      error: 'Foreign key constraint violation: referenced entity does not exist',
    });
  }

  // SQLite check constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_CHECK' || (err.message && err.message.includes('CHECK constraint failed'))) {
    return res.status(400).json({
      error: 'Constraint check failed: invalid value provided',
    });
  }

  // Custom status error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
