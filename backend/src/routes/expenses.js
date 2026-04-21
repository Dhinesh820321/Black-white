/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: API operations for Expenses
 */
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');

router.use(auth);

router.get('/', branchAccess, expenseController.getAllExpenses);

router.get('/summary', branchAccess, expenseController.getExpenseSummary);

router.get('/:id', expenseController.getExpense);

router.post('/', branchAccess, expenseController.createExpense);

router.put('/:id', authorize('admin'), expenseController.updateExpense);

router.delete('/:id', authorize('admin'), expenseController.deleteExpense);

module.exports = router;
