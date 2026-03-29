const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllExpenses = async (req, res, next) => {
  try {
    const { branch_id, category, date, start_date, end_date, month, year } = req.query;
    let expenses = await Expense.findAll({ branch_id, category, date, start_date, end_date, month, year });
    expenses = expenses.map(exp => {
      if (exp.branch_id && typeof exp.branch_id === 'object') {
        exp.branch_name = exp.branch_id.name;
        exp.branch_id = exp.branch_id._id || exp.branch_id.id;
      }
      if (exp.created_by && typeof exp.created_by === 'object') {
        exp.created_by_name = exp.created_by.name;
        exp.created_by = exp.created_by._id || exp.created_by.id;
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
    return successResponse(res, expense);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    console.log('📥 CREATE EXPENSE - Request body:', req.body);
    console.log('📥 CREATE EXPENSE - User:', req.user?.id, req.user?.role);
    
    const { branch_id, title, amount, category, receipt_image } = req.body;
    
    // Validate required fields
    if (!branch_id) {
      console.error('❌ branch_id is missing or empty');
      return errorResponse(res, 'Branch ID is required', 400);
    }
    if (!title) {
      console.error('❌ title is missing or empty');
      return errorResponse(res, 'Title is required', 400);
    }
    if (amount === undefined || amount === null || amount === '') {
      console.error('❌ amount is missing or empty');
      return errorResponse(res, 'Amount is required', 400);
    }
    
    const expense = await Expense.create({ branch_id, title, amount, category, receipt_image, created_by: req.user.id });
    console.log('✅ Expense created:', expense);
    return successResponse(res, expense, 'Expense created successfully', 201);
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
