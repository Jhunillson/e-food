const express = require('express');
const router = express.Router();
const deliveryPriceController = require('../controllers/deliveryPriceController');
const { authenticateUser } = require('../middleware/auth');

// Calcular preço de entrega baseado em GPS e distância
// Body: { restaurantId: number, addressId: number }
// Retorna: { distance: number, deliveryPrice: number, ... }
router.post('/calculate-price', 
  authenticateUser, 
  deliveryPriceController.calculateDeliveryPrice
);

// Buscar restaurantes próximos à localização do usuário
// Query params: latitude, longitude, radius (opcional, padrão 10km)
// Retorna: array de restaurantes com distância
router.get('/nearby-restaurants', 
  authenticateUser, 
  deliveryPriceController.getNearbyRestaurants
);

module.exports = router;