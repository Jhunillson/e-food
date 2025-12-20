const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Login
router.post('/login', adminController.login);

// Rotas protegidas
router.get('/stats', authenticateAdmin, adminController.getStats);
router.get('/restaurants', authenticateAdmin, adminController.getRestaurants);
router.put('/restaurants/:id/toggle', authenticateAdmin, adminController.toggleRestaurantStatus);
router.get('/deliveries', authenticateAdmin, adminController.getDeliveries);
router.put('/deliveries/:id/toggle', authenticateAdmin, adminController.toggleDeliveryStatus);
router.get('/orders', authenticateAdmin, adminController.getAllOrders);
router.get('/revenue-chart', authenticateAdmin, adminController.getRevenueChart);
router.get('/pending-orders', authenticateAdmin, adminController.getPendingOrders);
router.put('/orders/:id/approve', authenticateAdmin, adminController.approveOrder);
router.put('/orders/:id/reject', authenticateAdmin, adminController.rejectOrder);


module.exports = router;