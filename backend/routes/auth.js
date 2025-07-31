const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateLogin, validateCompanyUnit } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', validateLogin, AuthController.login);
router.post('/select-company-unit', authenticateToken, validateCompanyUnit, AuthController.selectCompanyUnit);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/validate', authenticateToken, AuthController.validateToken);

module.exports = router;