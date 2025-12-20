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

// Buscar pedido específico (cliente ou restaurante)
router.get('/:id', authenticateToken, orderController.getOrderById);

// Rate
router.post('/:orderId/rate', authenticateUser, orderController.rateOrder);

module.exports = router;