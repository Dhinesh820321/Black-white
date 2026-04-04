/**
 * @swagger
 * tags:
 *   name: ExpenseCategories
 *   description: API operations for Expense Categories
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', expenseCategoryController.getAllCategories);

router.get('/active', expenseCategoryController.getActiveCategories);

router.get('/:id', expenseCategoryController.getCategory);

router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('description').optional().trim()
], validate, expenseCategoryController.createCategory);

router.put('/:id', authorize('admin'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], validate, expenseCategoryController.updateCategory);

router.delete('/:id', authorize('admin'), expenseCategoryController.deleteCategory);

module.exports = router;
