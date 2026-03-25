const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, branchAccess } = require('../middlewares/auth');

router.use(auth);

router.get('/', branchAccess, attendanceController.getAllAttendance);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/summary', branchAccess, attendanceController.getAttendanceSummary);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

module.exports = router;
