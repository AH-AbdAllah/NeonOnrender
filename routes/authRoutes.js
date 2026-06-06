const express = require('express');
const AuthController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validatorMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.get('/users', authenticateToken, AuthController.listUsers);

module.exports = router;
