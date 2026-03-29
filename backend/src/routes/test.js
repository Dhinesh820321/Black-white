const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test API working
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/test', (req, res) => {
  res.send("Test API working");
});

module.exports = router;