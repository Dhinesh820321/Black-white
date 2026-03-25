const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth, branchAccess } = require('../middlewares/auth');

router.use(auth);

router.get('/', branchAccess, dashboardController.getDashboard);
router.get('/branch-comparison', auth, dashboardController.getBranchComparison);
router.get('/revenue-chart', branchAccess, dashboardController.getRevenueChart);
router.get('/top-performers', branchAccess, dashboardController.getTopPerformers);

module.exports = router;
