const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION FAILED:', errors.array());
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError?.msg || 'Validation failed',
      errors: errors.array()
    });
  }
  console.log('✅ VALIDATION PASSED');
  next();
};

module.exports = { validate };
