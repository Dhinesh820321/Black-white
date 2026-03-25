const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchAccess, employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployee);
router.get('/:id/performance', employeeController.getEmployeePerformance);
router.post('/', authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['admin', 'manager', 'stylist', 'helper']).withMessage('Invalid role')
], validate, employeeController.createEmployee);
router.put('/:id', authorize('admin', 'manager'), employeeController.updateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;
