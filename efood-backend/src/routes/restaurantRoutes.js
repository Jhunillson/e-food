const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticateRestaurant } = require('../middleware/auth');

// Rotas públicas
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/category/:category', restaurantController.getRestaurantsByCategory);

// Rotas protegidas (apenas restaurantes)
router.put('/update', authenticateRestaurant, restaurantController.updateRestaurant);

module.exports = router;