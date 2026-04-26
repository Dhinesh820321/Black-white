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
    console.log('📥 CREATE EXPENSE - Request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 CREATE EXPENSE - User:', req.user?.id, req.user?.name, req.user?.role, req.user?.branch_id);
    
    // Support new items array format OR old single item format
    const { title, amount, items, grand_total, payment_mode, notes, branch_id: requestedBranchId } = req.body;
    
    const employeeId = req.user._id || req.user.id;
    let branchId = req.user.branch_id;
    
    // Helpers can specify their own branch
    if (req.user.role === 'helper' && requestedBranchId) {
      branchId = requestedBranchId;
      console.log('📥 Helper selected branch:', branchId);
    }
    
    if (!employeeId) {
      console.error('❌ employee_id is missing from user');
      return errorResponse(res, 'Authentication error. Please login again.', 400);
    }
    
    if (typeof branchId === 'object' && branchId !== null) {
      branchId = branchId._id || branchId.id;
    }

    if (!branchId) {
      console.error('❌ branch_id is missing for user:', req.user?.name);
      return errorResponse(res, 'No branch assigned. Please contact your admin to assign a branch.', 400);
    }
    
    if (!payment_mode || !['CASH', 'UPI', 'GPAY'].includes(payment_mode)) {
      console.error('❌ invalid payment_mode');
      return errorResponse(res, 'Payment mode must be CASH, UPI or GPAY', 400);
    }
    
    let expenseData = {
      branch_id: branchId,
      employee_id: employeeId,
      payment_mode,
      notes: notes?.trim() || ''
    };
    
    // NEW FORMAT: Items array with grand_total
    if (items && Array.isArray(items) && items.length > 0) {
      // Clean and validate items
      const validItems = items.filter(item => 
        item.itemName && item.itemName.trim() && 
        item.price && parseFloat(item.price) > 0
      );
      
      if (validItems.length === 0) {
        return errorResponse(res, 'At least one valid item is required', 400);
      }
      
      // Calculate subtotals for each item
      expenseData.items = validItems.map(item => ({
        itemName: item.itemName.trim(),
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity) || 1,
        subtotal: parseFloat(item.price) * (parseInt(item.quantity) || 1)
      }));
      
      // Calculate grand_total - use provided value or calculate from items
      expenseData.grand_total = grand_total ? parseFloat(grand_total) : expenseData.items.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Use title from frontend if provided, otherwise generate from items
      if (title && title.trim()) {
        expenseData.title = title.trim();
      } else if (expenseData.items.length === 1) {
        expenseData.title = expenseData.items[0].itemName;
      } else if (expenseData.items.length === 2) {
        expenseData.title = expenseData.items.map(i => i.itemName).join(' & ');
      } else {
        expenseData.title = `${expenseData.items[0].itemName} + ${expenseData.items.length - 1} more`;
      }
    } 
    // OLD FORMAT: Single title and amount (backward compatibility)
    else if (title && title.trim()) {
      if (!amount || parseFloat(amount) <= 0) {
        return errorResponse(res, 'Valid amount is required', 400);
      }
      expenseData.title = title.trim();
      expenseData.amount = parseFloat(amount);
      expenseData.grand_total = parseFloat(amount);
    } 
    else {
      return errorResponse(res, 'Either items array or title is required', 400);
    }
    
    const expense = await Expense.create(expenseData);
    
    console.log('✅ Expense created:', expense._id);
    console.log('✅ Items:', expense.items);
    console.log('✅ Grand Total:', expense.grand_total);
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
