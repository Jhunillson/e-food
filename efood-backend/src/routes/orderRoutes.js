const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateUser, authenticateRestaurant } = require('../middleware/auth');

// Criar pedido (pode ser com ou sem autenticação)
router.post('/', authenticateToken, orderController.createOrder);

// Rotas para clientes
router.get('/user/orders', authenticateUser, orderController.getUserOrders);

// Rotas para restaurantes
router.get('/restaurant/orders', authenticateRestaurant, orderController.getRestaurantOrders);
router.get('/restaurant/stats', authenticateRestaurant, orderController.getRestaurantStats);
router.put('/restaurant/:id/status', authenticateRestaurant, orderController.updateOrderStatus);

// Nova rota para pegar pedidos do usuário logado
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { Order, Restaurant } = require('../models');

        const orders = await Order.findAll({
            where: { userId },
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon', 'phone']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos',
            error: error.message
        });
    }
});

// Buscar pedido específico (cliente ou restaurante)
router.get('/:id', authenticateToken, orderController.getOrderById);

// Rate
router.post('/:orderId/rate', authenticateUser, orderController.rateOrder);



module.exports = router;