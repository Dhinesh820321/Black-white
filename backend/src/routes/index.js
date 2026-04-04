const testRoutes = require('./test');
const express = require('express');
const router = express.Router();
router.use('/', testRoutes);
router.use('/auth', require('./auth'));
router.use('/branches', require('./branches'));
router.use('/employees', require('./employees'));
router.use('/attendance', require('./attendance'));
router.use('/payments', require('./payments'));
router.use('/invoices', require('./invoices'));
router.use('/services', require('./services'));
router.use('/customers', require('./customers'));
router.use('/expenses', require('./expenses'));
router.use('/expense-categories', require('./expenseCategories'));
router.use('/inventory', require('./inventory'));
router.use('/dashboard', require('./dashboard'));
router.use('/reports', require('./reports'));

module.exports = router;
