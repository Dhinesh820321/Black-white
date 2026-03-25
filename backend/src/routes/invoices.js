const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchAccess, invoiceController.getAllInvoices);
router.get('/daily-revenue', branchAccess, invoiceController.getDailyRevenue);
router.get('/monthly-revenue', branchAccess, invoiceController.getMonthlyRevenue);
router.get('/:id', invoiceController.getInvoice);
router.post('/', [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('employee_id').isInt().withMessage('Employee ID required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('payment_type').isIn(['UPI', 'CASH', 'CARD']).withMessage('Invalid payment type')
], validate, invoiceController.createInvoice);

module.exports = router;
