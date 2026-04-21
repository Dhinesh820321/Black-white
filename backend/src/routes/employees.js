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
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('phone').notEmpty().trim().withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

router.get('/phone/:phone', employeeController.getEmployeeByPhone);
router.delete('/phone/:phone', authorize('admin'), employeeController.deleteEmployeeByPhone);

module.exports = router;
