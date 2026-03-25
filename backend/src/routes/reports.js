const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');

router.use(auth);

router.get('/daily', branchAccess, reportsController.getDailyReport);
router.get('/monthly', branchAccess, reportsController.getMonthlyReport);
router.get('/branch-performance', authorize('admin'), reportsController.getBranchPerformanceReport);
router.get('/employee-performance', branchAccess, reportsController.getEmployeePerformanceReport);
router.get('/export', authorize('admin', 'manager'), reportsController.exportReport);

module.exports = router;
