const Invoice = require('../models/Invoice');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllInvoices = async (req, res, next) => {
  try {
    let { branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year } = req.query;
    
    branch_id = branch_id || null;
    customer_id = customer_id || null;
    employee_id = employee_id || null;
    payment_type = payment_type || null;
    date = date || null;
    start_date = start_date || null;
    end_date = end_date || null;
    month = month || null;
    year = year || null;

    let invoices = await Invoice.findAll({ branch_id, customer_id, employee_id, payment_type, date, start_date, end_date, month, year });
    invoices = invoices.map(inv => {
      if (inv.branch_id && typeof inv.branch_id === 'object') {
        inv.branch_name = inv.branch_id.name;
        inv.branch_id = inv.branch_id._id || inv.branch_id.id;
      }
      if (inv.customer_id && typeof inv.customer_id === 'object') {
        inv.customer_name = inv.customer_id.name;
        inv.customer_id = inv.customer_id._id || inv.customer_id.id;
      }
      if (inv.employee_id && typeof inv.employee_id === 'object') {
        inv.employee_name = inv.employee_id.name;
        inv.employee_id = inv.employee_id._id || inv.employee_id.id;
      }
      return inv;
    });
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
