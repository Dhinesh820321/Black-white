const Invoice = require('../models/Invoice');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllInvoices = async (req, res, next) => {
  try {
    const { branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year } = req.query;
    const invoices = await Invoice.findAll({ branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year });
    return successResponse(res, invoices);
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }
    return successResponse(res, invoice);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { branch_id, customer_id, employee_id, items, total_amount, tax_amount, discount, final_amount, payment_type, notes } = req.body;
    const invoice = await Invoice.create({ branch_id, customer_id, employee_id, items, total_amount, tax_amount, discount, final_amount, payment_type, notes });
    return successResponse(res, invoice, 'Invoice created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getDailyRevenue = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const revenue = await Invoice.getDailyRevenue(branch_id, date || new Date().toISOString().split('T')[0]);
    return successResponse(res, revenue);
  } catch (error) {
    next(error);
  }
};

const getMonthlyRevenue = async (req, res, next) => {
  try {
    const { branch_id, year, month } = req.query;
    const now = new Date();
    const revenue = await Invoice.getMonthlyRevenue(branch_id, year || now.getFullYear(), month || now.getMonth() + 1);
    return successResponse(res, revenue);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllInvoices, getInvoice, createInvoice, getDailyRevenue, getMonthlyRevenue };
