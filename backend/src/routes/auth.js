const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.post('/login/password', [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.passwordLogin);

router.post('/login/otp/request', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.requestOTP);

router.post('/login/otp/verify', [
  body('phone').notEmpty(),
  body('otp').notEmpty().withMessage('OTP required')
], validate, authController.verifyOTP);

router.post('/register', authorize('admin', 'manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('role').isIn(['admin', 'manager', 'stylist', 'helper']).withMessage('Invalid role')
], validate, authController.createEmployee);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 chars')
], validate, authController.changePassword);

router.post('/reset-password', [
  body('phone').isMobilePhone('any').withMessage('Valid phone required')
], validate, authController.resetPassword);

router.get('/sessions', auth, authController.getSessions);
router.delete('/sessions/:session_id', auth, authController.logoutSession);
router.post('/update-device', auth, authController.updateDevice);

module.exports = router;
