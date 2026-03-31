const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const { errorResponse } = require('../utils/responseHelper');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`🔐 Auth middleware: ${req.method} ${req.path}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No token provided');
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(`   Token decoded - branch_id from token: ${decoded.branch_id}`);

    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      console.log('❌ Auth failed: User not found or inactive');
      return errorResponse(res, 'Invalid token. User not found or inactive.', 401);
    }

    console.log(`   User from DB - branch_id: ${user.branch_id}, populated: ${typeof user.branch_id === 'object'}`);
    
    if (decoded.branch_id) {
      user.branch_id = decoded.branch_id;
    } else if (user.branch_id && typeof user.branch_id === 'object') {
      user.branch_id = user.branch_id._id || user.branch_id.id;
    }
    
    req.user = user;
    console.log(`✅ Auth success: ${user.name} (${user.role}) - final branch_id: ${user.branch_id}`);
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
