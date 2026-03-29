const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllPayments = async (req, res, next) => {
  try {
    const { branch_id, employee_id, payment_type, date, start_date, end_date, month, year } = req.query;
    let payments = await Payment.findAll({ branch_id, employee_id, payment_type, date, start_date, end_date, month, year });
    payments = payments.map(p => {
      if (p.branch_id && typeof p.branch_id === 'object') {
        p.branch_name = p.branch_id.name;
        p.branch_id = p.branch_id._id || p.branch_id.id;
      }
      if (p.employee_id && typeof p.employee_id === 'object') {
        p.employee_name = p.employee_id.name;
        p.employee_id = p.employee_id._id || p.employee_id.id;
      }
      return p;
    });
    return successResponse(res, payments);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { invoice_id, amount, payment_type, notes } = req.body;
    
    const employeeId = req.user._id || req.user.id;
    const branchId = req.user.branch_id;

    console.log('📋 CREATE PAYMENT:', { 
      user: req.user?.name, 
      employeeId, 
      branchId,
      amount,
      payment_type
    });

    if (!branchId) {
      return errorResponse(res, 'Branch ID missing. Please contact admin.', 400);
    }

    const payment = await Payment.create({ 
      branch_id: branchId, 
      employee_id: employeeId, 
      invoice_id, 
      amount, 
      payment_type, 
      notes 
    });
    
    console.log('✅ PAYMENT CREATED:', payment._id);
    return successResponse(res, payment, 'Payment recorded successfully', 201);
  } catch (error) {
    console.error('❌ CREATE PAYMENT ERROR:', error.message);
    next(error);
  }
};

const getDailyTotals = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const totals = await Payment.getDailyTotals(branch_id, date || new Date().toISOString().split('T')[0]);
    return successResponse(res, totals);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const analytics = await Payment.getAnalytics(branch_id, start_date, end_date);
    return successResponse(res, analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPayments, createPayment, getDailyTotals, getAnalytics };
