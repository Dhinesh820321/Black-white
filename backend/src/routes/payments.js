const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);

router.get('/', branchAccess, paymentController.getAllPayments);
router.get('/daily-totals', branchAccess, paymentController.getDailyTotals);
router.get('/analytics', branchAccess, paymentController.getAnalytics);
router.post('/', authorize('admin', 'manager'), [
  body('branch_id').isInt().withMessage('Branch ID required'),
  body('employee_id').isInt().withMessage('Employee ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('payment_type').isIn(['UPI', 'CASH', 'CARD']).withMessage('Invalid payment type')
], validate, paymentController.createPayment);

module.exports = router;
