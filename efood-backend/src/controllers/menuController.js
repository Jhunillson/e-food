const { MenuItem, Restaurant } = require('../models');

// Listar cardápio de um restaurante
exports.getMenuByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const menuItems = await MenuItem.findAll({
            where: { 
                restaurantId,
                isAvailable: true 
            },
            order: [['category', 'ASC'], ['name', 'ASC']]
        });

        res.json({
            success: true,
            data: menuItems
        });
    } catch (error) {
        console.error('Erro ao buscar cardápio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cardápio',
            error: error.message
        });
    }
};

// Adicionar item ao cardápio (apenas o restaurante dono)
exports.createMenuItem = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { name, description, price, category, icon, image_url } = req.body;

        // Verificar se restaurante existe
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        // Criar item
        const menuItem = await MenuItem.create({
            restaurantId,
            name,
            description,
            price,
            category,
            icon: icon || '🍽️',
            image_url: image_url || null
        });

        res.status(201).json({
            success: true,
            message: 'Item adicionado ao cardápio',
            data: menuItem
        });
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar item',
            error: error.message
        });
    }
};

// Atualizar item do cardápio
exports.updateMenuItem = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { id } = req.params;
        const { name, description, price, category, icon, image_url, isAvailable } = req.body;

        // Buscar item
        const menuItem = await MenuItem.findOne({
            where: { 
                id,
                restaurantId 
            }
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado ou não pertence ao seu restaurante'
            });
        }

        // Atualizar
        await menuItem.update({
            name: name || menuItem.name,
            description: description || menuItem.description,
            price: price || menuItem.price,
            category: category || menuItem.category,
            icon: icon || menuItem.icon,
            image_url: image_url !== undefined ? image_url : menuItem.image_url,
            isAvailable: isAvailable !== undefined ? isAvailable : menuItem.isAvailable
        });

        res.json({
            success: true,
            message: 'Item atualizado',
            data: menuItem
        });
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar item',
            error: error.message
        });
    }
};

// Deletar item do cardápio
exports.deleteMenuItem = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { id } = req.params;

        // Buscar item
        const menuItem = await MenuItem.findOne({
            where: { 
                id,
                restaurantId 
            }
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        // Deletar
        await menuItem.destroy();

        res.json({
            success: true,
            message: 'Item removido do cardápio'
        });
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar item',
            error: error.message
        });
    }
};

// Buscar item específico
exports.getMenuItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const menuItem = await MenuItem.findByPk(id, {
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon']
            }]
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar item',
            error: error.message
        });
    }
};