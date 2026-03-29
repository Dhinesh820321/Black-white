const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
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

    const employee = await Employee.findById(decoded.id);

    if (!employee || employee.status !== 'active') {
      console.log('❌ Auth failed: User not found or inactive');
      return errorResponse(res, 'Invalid token. User not found or inactive.', 401);
    }

    req.user = employee;
    console.log(`✅ Auth success: ${employee.name} (${employee.role})`);
    next();
  } catch (error) {
    console.error(`❌ Auth error: ${error.name} - ${error.message}`);
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired.', 401);
    }
    return errorResponse(res, `Authentication failed: ${error.message}`, 500);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`🔑 AUTHORIZE: User role: "${req.user?.role}", Required roles: [${roles.join(', ')}]`);
    if (!roles.includes(req.user.role)) {
      console.log(`❌ AUTHORIZE FAILED: User role "${req.user.role}" not in allowed roles`);
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
    }
    console.log(`✅ AUTHORIZE SUCCESS`);
    next();
  };
};

const branchAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.branch_id) {
      console.error(`400 ERROR in branchAccess: User ${req.user.employee_id} (${req.user.role}) has no branch_id!`);
      return errorResponse(res, 'No branch assigned to this user.', 400);
    }

    // Auto-inject branch_id into queries for non-admins if not provided or invalid
    if (req.user.branch_id) {
      const bId = req.user.branch_id.toString();
      if (!req.query.branch_id || !mongoose.Types.ObjectId.isValid(req.query.branch_id)) {
        req.query.branch_id = bId;
      }
      req.allowedBranch = req.user.branch_id;
    }
    next();
  } catch (error) {
    return errorResponse(res, `Branch access check failed: ${error.message}`, 500);
  }
};

module.exports = { auth, authorize, branchAccess };
