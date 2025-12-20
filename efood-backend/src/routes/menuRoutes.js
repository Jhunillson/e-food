const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateRestaurant } = require('../middleware/auth');

// Rotas públicas
router.get('/restaurant/:restaurantId', menuController.getMenuByRestaurant);
router.get('/item/:id', menuController.getMenuItemById);

// Rotas protegidas (apenas restaurantes)
router.post('/', authenticateRestaurant, menuController.createMenuItem);
router.put('/:id', authenticateRestaurant, menuController.updateMenuItem);
router.delete('/:id', authenticateRestaurant, menuController.deleteMenuItem);

module.exports = router;