const { Restaurant, MenuItem } = require('../models');

// Listar todos os restaurantes
exports.getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.findAll({
            where: { isActive: true },
            attributes: { exclude: ['password'] },
            order: [['rating', 'DESC']]
        });

        res.json({
            success: true,
            data: restaurants
        });
    } catch (error) {
        console.error('Erro ao buscar restaurantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurantes',
            error: error.message
        });
    }
};

// Buscar restaurante por ID
exports.getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: MenuItem,
                as: 'menuItems',
                where: { isAvailable: true },
                required: false
            }]
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        res.json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        console.error('Erro ao buscar restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurante',
            error: error.message
        });
    }
};

// Atualizar dados do restaurante (apenas o próprio restaurante)
exports.updateRestaurant = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { name, icon, image_url, category, cuisine, phone, address, minTime, maxTime } = req.body;

        const restaurant = await Restaurant.findByPk(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        // Atualizar campos
        await restaurant.update({
            name: name || restaurant.name,
            icon: icon || restaurant.icon,
            image_url: image_url !== undefined ? image_url : restaurant.image_url,
            category: category || restaurant.category,
            cuisine: cuisine || restaurant.cuisine,
            phone: phone || restaurant.phone,
            address: address || restaurant.address,
            minTime: minTime || restaurant.minTime,
            maxTime: maxTime || restaurant.maxTime
        });

        res.json({
            success: true,
            message: 'Restaurante atualizado com sucesso',
            data: {
                id: restaurant.id,
                name: restaurant.name,
                icon: restaurant.icon,
                image_url: restaurant.image_url,
                category: restaurant.category,
                cuisine: restaurant.cuisine
            }
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

// Buscar restaurantes por categoria
exports.getRestaurantsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const restaurants = await Restaurant.findAll({
            where: { 
                category,
                isActive: true 
            },
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            data: restaurants
        });
    } catch (error) {
        console.error('Erro ao buscar restaurantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar restaurantes',
            error: error.message
        });
    }
};