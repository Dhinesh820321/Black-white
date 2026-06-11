const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION FAILED:', errors.array());
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError?.msg || 'Validation failed',
      error: firstError?.msg || 'Validation failed',
      errors: errors.array()
    });
  }
  console.log('✅ VALIDATION PASSED');
  next();
};

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (val && !mongoose.Types.ObjectId.isValid(val)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        error: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

module.exports = { validate, validateObjectId };
