const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { errorResponse } = require('../utils/responseHelper');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`🔐 Auth middleware: ${req.method} ${req.path}`);
    console.log(`   Auth header present: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No token provided');
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    console.log(`   Token preview: ${token.substring(0, 20)}...`);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`   Token decoded:`, decoded);

    const [employees] = await pool.query(
      'SELECT id, name, role, branch_id, phone FROM employees WHERE id = ? AND status = ?',
      [decoded.id, 'active']
    );

    if (employees.length === 0) {
      console.log('❌ Auth failed: User not found or inactive');
      return errorResponse(res, 'Invalid token. User not found.', 401);
    }

    req.user = employees[0];
    console.log(`✅ Auth success: ${employees[0].name} (${employees[0].role})`);
    next();
  } catch (error) {
    console.error(`❌ Auth error: ${error.name} - ${error.message}`);
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};

const branchAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      req.branchFilter = '';
      return next();
    }

    if (!req.user.branch_id) {
      return errorResponse(res, 'No branch assigned to this user.', 400);
    }

    req.branchFilter = `branch_id = ${req.user.branch_id}`;
    req.allowedBranch = req.user.branch_id;
    next();
  } catch (error) {
    return errorResponse(res, 'Branch access check failed.', 500);
  }
};

module.exports = { auth, authorize, branchAccess };
