const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllPayments = async (req, res, next) => {
  try {
    const { branch_id, employee_id, payment_type, date, start_date, end_date, month, year } = req.query;
    const payments = await Payment.findAll({ branch_id, employee_id, payment_type, date, start_date, end_date, month, year });
    return successResponse(res, payments);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { branch_id, employee_id, invoice_id, amount, payment_type, notes } = req.body;
    const payment = await Payment.create({ branch_id, employee_id, invoice_id, amount, payment_type, notes });
    return successResponse(res, payment, 'Payment recorded successfully', 201);
  } catch (error) {
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
