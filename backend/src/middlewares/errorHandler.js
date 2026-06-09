const errorHandler = (err, req, res, next) => {
  console.error('❌ ERROR:', err.name, err.message);
  console.error('Stack:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    const msg = messages.join(', ');
    return res.status(400).json({
      success: false,
      message: msg,
      error: msg
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const msg = `${field} already exists`;
    return res.status(400).json({
      success: false,
      message: msg,
      error: msg
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const msg = 'Invalid ID format';
    return res.status(400).json({
      success: false,
      message: msg,
      error: msg
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const msg = 'Invalid token';
    return res.status(401).json({
      success: false,
      message: msg,
      error: msg
    });
  }

  if (err.name === 'TokenExpiredError') {
    const msg = 'Token expired';
    return res.status(401).json({
      success: false,
      message: msg,
      error: msg
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.message || 'Internal server error'
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
