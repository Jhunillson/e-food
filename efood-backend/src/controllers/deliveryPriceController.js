const { Restaurant, Address } = require('../models');
const { sequelize } = require('../models');
const GeocodingService = require('../services/geocodingService');

// Calcular preço de entrega
exports.calculateDeliveryPrice = async (req, res) => {
  try {
    const { restaurantId, addressId } = req.body;

    // Buscar restaurante
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurante não encontrado' 
      });
    }

    // Buscar endereço do cliente
    const address = await Address.findByPk(addressId);
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Endereço não encontrado' 
      });
    }

    // Verificar se o restaurante tem coordenadas
    if (!restaurant.latitude || !restaurant.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurante sem localização configurada' 
      });
    }

    // Geocodificar endereço do cliente se necessário
    if (!address.latitude || !address.longitude) {
      console.log('Geocodificando endereço do cliente...');
      const coords = await GeocodingService.geocodeAddress(address);
      await address.update({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }

    // Calcular distância
    const distance = await GeocodingService.calculateDistance(
      sequelize,
      { latitude: restaurant.latitude, longitude: restaurant.longitude },
      { latitude: address.latitude, longitude: address.longitude }
    );

    // Calcular preço
    const deliveryPrice = GeocodingService.calculateDeliveryPrice(distance);

    res.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100, // 2 casas decimais
        deliveryPrice,
        pricePerKm: 200,
        restaurant: {
          name: restaurant.name,
          address: restaurant.address
        },
        clientAddress: {
          street: address.street,
          municipality: address.municipality
        }
      }
    });

  } catch (error) {
    console.error('Erro ao calcular preço de entrega:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao calcular preço de entrega',
      error: error.message 
    });
  }
};

// VERSÃO OTIMIZADA - Substitua a função getNearbyRestaurants no deliveryPriceController.js

exports.getNearbyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude e longitude são obrigatórias' 
      });
    }

    console.log(`🔍 Buscando restaurantes próximos: lat=${latitude}, lon=${longitude}, radius=${radius}km`);

    // 🔧 QUERY OTIMIZADA - calcula distância apenas uma vez
    const query = `
      WITH distances AS (
        SELECT 
          id,
          name,
          address,
          latitude,
          longitude,
          calculate_distance(:lat, :lon, latitude, longitude) as distance_km
        FROM restaurants
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND "isActive" = true
      )
      SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        ROUND(distance_km, 2) as distance_km
      FROM distances
      WHERE distance_km <= :radius
      ORDER BY distance_km ASC
      LIMIT 20
    `;

    const startTime = Date.now();

    const restaurants = await sequelize.query(query, {
      replacements: {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        radius: parseInt(radius)
      },
      type: sequelize.QueryTypes.SELECT
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Query executada em ${duration}ms - ${restaurants.length} restaurantes encontrados`);

    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('❌ Erro ao buscar restaurantes próximos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar restaurantes próximos',
      error: error.message 
    });
  }
};

// Calcular preço de entrega por endereço inline (sem addressId)
exports.calculateByAddress = async (req, res) => {
  try {
    const { restaurantId, address } = req.body;

    if (!restaurantId || !address) {
      return res.status(400).json({
        success: false,
        message: 'restaurantId e address são obrigatórios'
      });
    }

    if (!address.municipality && !address.province) {
      return res.status(400).json({
        success: false,
        message: 'Endereço incompleto: municipality ou province são obrigatórios'
      });
    }

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante não encontrado'
      });
    }

    let restaurantCoords;
    if (restaurant.latitude && restaurant.longitude) {
      restaurantCoords = { latitude: parseFloat(restaurant.latitude), longitude: parseFloat(restaurant.longitude) };
    } else {
      restaurantCoords = await GeocodingService.geocodeAddress(restaurant.address || restaurant.name);
    }

    const clientCoords = await GeocodingService.geocodeAddress(address);

    const distance = await GeocodingService.calculateDistance(
      sequelize,
      restaurantCoords,
      clientCoords
    );

    const deliveryPrice = GeocodingService.calculateDeliveryPrice(distance);

    res.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        deliveryPrice,
        restaurant: { name: restaurant.name },
        clientAddress: { municipality: address.municipality, province: address.province }
      }
    });

  } catch (error) {
    console.error('Erro ao calcular preço por endereço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular preço de entrega',
      error: error.message
    });
  }
};

module.exports = exports;