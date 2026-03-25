const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchAccess, expenseController.getAllExpenses);
router.get('/summary', branchAccess, expenseController.getExpenseSummary);
router.get('/:id', expenseController.getExpense);
router.post('/', authorize('admin', 'manager'), [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('category').isIn(['rent', 'salary', 'electricity', 'supplies', 'misc']).withMessage('Invalid category')
], validate, expenseController.createExpense);
router.put('/:id', authorize('admin', 'manager'), expenseController.updateExpense);
router.delete('/:id', authorize('admin'), expenseController.deleteExpense);

module.exports = router;
