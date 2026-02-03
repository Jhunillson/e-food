const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authenticateUser } = require('../middleware/auth');

// Rotas públicas (sem autenticação)
router.post('/register/user', authController.registerUser);
router.post('/login/user', authController.loginUser);
router.post('/register/restaurant', authController.registerRestaurant);
router.post('/login/restaurant', authController.loginRestaurant);

// Rotas protegidas (requer autenticação)
router.get('/profile', authenticateToken, authController.getProfile);

// Atualizar perfil do usuário
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;

        const { User } = require('../models');
        
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Atualizar campos
        if (name) user.name = name;
        if (phone) user.phone = phone;
        
        await user.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
});

module.exports = router;