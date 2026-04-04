const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllExpenses = async (req, res, next) => {
  try {
    const { branch_id, employee_id, category_id, payment_mode, date, start_date, end_date } = req.query;
    let expenses = await Expense.findAll({ branch_id, employee_id, category_id, payment_mode, date, start_date, end_date });
    expenses = expenses.map(exp => {
      if (exp.branch_id && typeof exp.branch_id === 'object') {
        exp.branch_name = exp.branch_id.name;
        exp.branch_id = exp.branch_id._id || exp.branch_id.id;
      }
      if (exp.employee_id && typeof exp.employee_id === 'object') {
        exp.employee_name = exp.employee_id.name;
        exp.employee_phone = exp.employee_id.phone;
        exp.employee_id = exp.employee_id._id || exp.employee_id.id;
      }
      if (exp.category_id && typeof exp.category_id === 'object') {
        exp.category_name = exp.category_id.name;
        exp.category_id = exp.category_id._id || exp.category_id.id;
      }
      return exp;
    });
    return successResponse(res, expenses);
  } catch (error) {
    next(error);
  }
};

const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return errorResponse(res, 'Expense not found', 404);
    }
    if (expense.branch_id && typeof expense.branch_id === 'object') {
      expense.branch_name = expense.branch_id.name;
      expense.branch_id = expense.branch_id._id || expense.branch_id.id;
    }
    if (expense.employee_id && typeof expense.employee_id === 'object') {
      expense.employee_name = expense.employee_id.name;
      expense.employee_id = expense.employee_id._id || expense.employee_id.id;
    }
    if (expense.category_id && typeof expense.category_id === 'object') {
      expense.category_name = expense.category_id.name;
      expense.category_id = expense.category_id._id || expense.category_id.id;
    }
    return successResponse(res, expense);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    console.log('📥 CREATE EXPENSE - Request body:', req.body);
    console.log('📥 CREATE EXPENSE - User:', req.user?.id, req.user?.role);
    
    const { title, amount, payment_mode, notes } = req.body;
    
    const employeeId = req.user._id || req.user.id;
    let branchId = req.user.branch_id;
    
    if (typeof branchId === 'object' && branchId !== null) {
      branchId = branchId._id || branchId.id;
    }

    if (!branchId) {
      console.error('❌ branch_id is missing');
      return errorResponse(res, 'Branch ID missing. Please contact admin.', 400);
    }
    if (!title || !title.trim()) {
      console.error('❌ title is missing');
      return errorResponse(res, 'Title is required', 400);
    }
    if (!amount || parseFloat(amount) <= 0) {
      console.error('❌ invalid amount');
      return errorResponse(res, 'Valid amount is required', 400);
    }
    if (!payment_mode || !['CASH', 'ONLINE'].includes(payment_mode)) {
      console.error('❌ invalid payment_mode');
      return errorResponse(res, 'Payment mode must be CASH or ONLINE', 400);
    }
    
    const expense = await Expense.create({
      branch_id: branchId,
      employee_id: employeeId,
      title: title.trim(),
      amount: parseFloat(amount),
      payment_mode,
      notes: notes?.trim() || ''
    });
    
    console.log('✅ Expense created:', expense._id);
    return successResponse(res, expense, 'Expense recorded successfully', 201);
  } catch (error) {
    console.error('❌ CREATE EXPENSE ERROR:', error);
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.update(req.params.id, req.body);
    if (!expense) {
      return errorResponse(res, 'Expense not found', 404);
    }
    return successResponse(res, expense, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await Expense.delete(req.params.id);
    return successResponse(res, null, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const summary = await Expense.getSummary(branch_id, start_date, end_date);
    return successResponse(res, summary);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseSummary };
