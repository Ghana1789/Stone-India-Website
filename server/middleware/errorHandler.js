import AuditLog from '../models/AuditLog.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // Log detailed error securely on the server
  console.error(`[Secure Error Handler] [${req.method}] ${req.originalUrl} (${statusCode}):`, {
    message: err.message,
    stack: err.stack,
    ip: req.ip,
    user: req.user ? { id: req.user._id, email: req.user.email } : 'anonymous'
  });

  // Avoid saving sensitive error details if it could contain sensitive info, but log system exceptions in AuditLog
  if (statusCode >= 500) {
    AuditLog.create({
      action: 'OTHER',
      entity: 'SystemError',
      description: `Server Error in ${req.method} ${req.originalUrl}: ${err.message}`,
      metadata: { path: req.originalUrl, ip: req.ip },
      status: 'failed'
    }).catch(() => {});
  }

  // Display generic user-friendly messages. Never expose stack traces or DB details.
  let clientMessage = 'An internal system error occurred. Please try again later.';
  
  // Custom user-friendly handling for Mongoose duplicate key errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map(val => val.message).join(', ')
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'A duplicate record already exists in our system.'
    });
  }

  // If error has a specific safe/custom flag, use its message
  if (err.isOperational) {
    clientMessage = err.message;
  } else if (statusCode < 500) {
    clientMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage
  });
};
