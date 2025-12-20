const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateDelivery } = require('../middleware/auth');

// Rotas públicas (sem autenticação)
router.post('/register', deliveryController.register);
router.post('/login', deliveryController.login);

// Rotas protegidas (requer autenticação de entregador)
router.get('/stats', authenticateDelivery, deliveryController.getStats);
router.put('/online-status', authenticateDelivery, deliveryController.updateOnlineStatus);
router.get('/available-orders', authenticateDelivery, deliveryController.getAvailableOrders);
router.post('/accept-order/:orderId', authenticateDelivery, deliveryController.acceptOrder);
router.post('/ignore-order', authenticateDelivery, deliveryController.ignoreOrder);
router.put('/update-status/:orderId', authenticateDelivery, deliveryController.updateDeliveryStatus);
router.get('/my-orders', authenticateDelivery, deliveryController.getMyOrders);

module.exports = router;