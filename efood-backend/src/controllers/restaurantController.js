const { Restaurant, MenuItem } = require('../models');

exports.getAllRestaurants = async (req, res) => {
    const startTotal = Date.now();
    console.log('🔵 Iniciando getAllRestaurants');
    
    try {
        console.time('  └─ Query');
        const restaurants = await Restaurant.findAll({
            where: { isActive: true },
            attributes: [
                'id',
                'name', 
                'icon',
                'image_url',  
                'category',
                'cuisine',
                'rating',
                'minTime',
                'maxTime',
                'isOpen',
                'isActive'
            ],
            order: [['rating', 'DESC']],
            limit: 20,  // ← Reduzi para 20 também
            raw: true
        });
        console.timeEnd('  └─ Query');
        console.log(`  └─ Retornou ${restaurants.length} restaurantes`);
        
        console.time('  └─ JSON stringify');
        const json = JSON.stringify({ success: true, data: restaurants });
        console.timeEnd('  └─ JSON stringify');
        console.log(`  └─ Tamanho: ${(json.length / 1024).toFixed(2)} KB`);
        
        res.json({ success: true, data: restaurants });
        
        console.log(`✅ Total: ${Date.now() - startTotal}ms\n`);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurantes',
            error: error.message
        });
    }
};

// Mantenha as outras funções como estavam
exports.getRestaurantById = async (req, res) => {
    console.time('getRestaurantById');
    
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: MenuItem,
                as: 'menuItems',
                where: { isAvailable: true },
                required: false,
                limit: 100,
                attributes: [
                    'id',
                    'name',
                    'description',
                    'price',
                    'image_url',
                    'category',
                    'isAvailable'
                ]
            }]
        });

        if (!restaurant) {
            console.timeEnd('getRestaurantById');
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        console.timeEnd('getRestaurantById');
        
        res.json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        console.timeEnd('getRestaurantById');
        console.error('Erro ao buscar restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurante',
            error: error.message
        });
    }
};

exports.updateRestaurant = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { name, icon, image_url, category, cuisine, phone, address, minTime, maxTime } = req.body;

        const [updated] = await Restaurant.update({
            name,
            icon,
            image_url,
            category,
            cuisine,
            phone,
            address,
            minTime,
            maxTime
        }, {
            where: { id: restaurantId },
            returning: true
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        const restaurant = await Restaurant.findByPk(restaurantId, {
            attributes: ['id', 'name', 'icon', 'image_url', 'category', 'cuisine'],
            raw: true
        });

        res.json({
            success: true,
            message: 'Restaurante atualizado com sucesso',
            data: restaurant
        });
    } catch (error) {
        console.error('Erro ao atualizar restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar restaurante',
            error: error.message
        });
    }
};

exports.getRestaurantsByCategory = async (req, res) => {
    console.time('getRestaurantsByCategory');
    
    try {
        const { category } = req.params;

        const restaurants = await Restaurant.findAll({
            where: { 
                category,
                isActive: true
            },
            attributes: [
                'id',
                'name',
                'icon',
                'image_url',
                'category',
                'cuisine',
                'rating',
                'minTime',
                'maxTime',
                'isOpen',
                'isActive'
            ],
            limit: 50,
            raw: true
        });

        console.timeEnd('getRestaurantsByCategory');

        res.json({
            success: true,
            data: restaurants
        });
    } catch (error) {
        console.timeEnd('getRestaurantsByCategory');
        console.error('Erro ao buscar restaurantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurantes',
            error: error.message
        });
    }
};
const GeocodingService = require('../services/geocodingService');

// Atualizar coordenadas de um restaurante
exports.updateRestaurantCoordinates = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const restaurant = await Restaurant.findByPk(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante não encontrado'
      });
    }

    // Geocodificar endereço
    const addressObj = {
      street: restaurant.address,
      municipality: 'Luanda', // Extrair do endereço se possível
      province: 'Luanda'
    };

    const coords = await GeocodingService.geocodeAddress(addressObj);

    // Atualizar restaurante
    await restaurant.update({
      latitude: coords.latitude,
      longitude: coords.longitude
    });

    res.json({
      success: true,
      message: 'Coordenadas atualizadas com sucesso',
      data: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        latitude: coords.latitude,
        longitude: coords.longitude
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar coordenadas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar coordenadas',
      error: error.message
    });
  }
};

// Geocodificar TODOS os restaurantes sem coordenadas
exports.geocodeAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll({
      where: {
        latitude: null
      }
    });

    const results = [];

    for (const restaurant of restaurants) {
      try {
        // Extrair informações do endereço
        const addressParts = restaurant.address.split(',').map(s => s.trim());
        
        const addressObj = {
          street: addressParts[0] || restaurant.address,
          municipality: addressParts[1] || 'Luanda',
          province: addressParts[2] || 'Luanda'
        };

        const coords = await GeocodingService.geocodeAddress(addressObj);

        await restaurant.update({
          latitude: coords.latitude,
          longitude: coords.longitude
        });

        results.push({
          id: restaurant.id,
          name: restaurant.name,
          status: 'success',
          coordinates: coords
        });

        console.log(`✅ ${restaurant.name}: ${coords.latitude}, ${coords.longitude}`);

      } catch (error) {
        results.push({
          id: restaurant.id,
          name: restaurant.name,
          status: 'error',
          error: error.message
        });
        
        console.error(`❌ Erro ao geocodificar ${restaurant.name}:`, error.message);
      }

      // Delay para não sobrecarregar API (Nominatim tem limite de 1 req/segundo)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    res.json({
      success: true,
      message: 'Geocodificação concluída',
      data: {
        total: restaurants.length,
        processed: results.length,
        results
      }
    });

  } catch (error) {
    console.error('Erro ao geocodificar restaurantes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao geocodificar restaurantes',
      error: error.message
    });
  }
};