/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: API operations for Employees
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { auth, authorize, branchAccess } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(auth);


/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags: [Employees]
 *     summary: GET /api/employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.get('/', branchAccess, employeeController.getAllEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: GET /api/employees/{id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.get('/:id', employeeController.getEmployee);

/**
 * @swagger
 * /api/employees/{id}/performance:
 *   get:
 *     tags: [Employees]
 *     summary: GET /api/employees/{id}/performance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.get('/:id/performance', employeeController.getEmployeePerformance);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     tags: [Employees]
 *     summary: POST /api/employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], validate, employeeController.createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: PUT /api/employees/{id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.put('/:id', authorize('admin', 'manager'), employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     tags: [Employees]
 *     summary: DELETE /api/employees/{id}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;
