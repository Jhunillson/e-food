const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas (sem autenticação)
router.post('/register/user', authController.registerUser);
router.post('/login/user', authController.loginUser);
router.post('/register/restaurant', authController.registerRestaurant);
router.post('/login/restaurant', authController.loginRestaurant);

// Rotas protegidas (requer autenticação)
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;