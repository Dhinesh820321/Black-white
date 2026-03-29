const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
const { errorResponse } = require('../utils/responseHelper');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development') {
        // Bypass authentication for development with dummy ObjectId
        req.user = {
          _id: new mongoose.Types.ObjectId(),
          id: 'dev-admin',
          employee_id: 'ADM001',
          name: 'Dev Admin',
          role: 'admin',
          phone: '9999999999',
          branch_id: null,
          status: 'active'
        };
        console.log('👷 MDB Dev Bypass: Authenticated as Dev Admin');
        return next();
      }
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const employee = await Employee.findById(decoded.id);

    if (!employee || employee.status !== 'active') {
      return errorResponse(res, 'Invalid token. User not found or inactive.', 401);
    }

    req.user = employee;
    next();
  } catch (error) {
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
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
    }
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
