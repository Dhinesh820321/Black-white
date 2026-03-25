const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllExpenses = async (req, res, next) => {
  try {
    const { branch_id, category, date, start_date, end_date, month, year } = req.query;
    const expenses = await Expense.findAll({ branch_id, category, date, start_date, end_date, month, year });
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
    const { branch_id, title, amount, category, receipt_image } = req.body;
    const expense = await Expense.create({ branch_id, title, amount, category, receipt_image, created_by: req.user.id });
    return successResponse(res, expense, 'Expense created successfully', 201);
  } catch (error) {
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
