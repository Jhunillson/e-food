const { Admin, Restaurant, Delivery, Order, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login do admin
exports.login = async (req, res) => {
    try {

        console.log('🔐 Login admin chamado');
        console.log('Body recebido:', req.body);
        
        const { email, password } = req.body;

        const admin = await Admin.findOne({ where: { email } });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin não encontrado'
            });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Senha incorreta'
            });
        }

        const token = jwt.sign(
            { id: admin.id, type: 'admin', role: admin.role },
            process.env.JWT_SECRET || 'seu_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer login',
            error: error.message
        });
    }
};

// Obter estatísticas gerais
exports.getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total de usuários
        const totalUsers = await User.count();
        
        // Total de restaurantes
        const totalRestaurants = await Restaurant.count();
        const activeRestaurants = await Restaurant.count({ where: { isActive: true } });
        
        // Total de entregadores
        const totalDeliveries = await Delivery.count();
        const activeDeliveries = await Delivery.count({ where: { isActive: true } });
        
        // Total de pedidos
        const totalOrders = await Order.count();
        const completedOrders = await Order.count({ where: { status: 'completed' } });
        
        // Pedidos de hoje
        const todayOrdersCount = await Order.count({
            where: {
                createdAt: { [Op.gte]: today }
            }
        });
        
        // Receita total (pedidos concluídos)
        const totalRevenue = await Order.sum('total', {
            where: { status: 'completed' }
        });
        
        // Receita de hoje
        const todayRevenue = await Order.sum('total', {
            where: {
                status: 'completed',
                createdAt: { [Op.gte]: today }
            }
        });
        
        // Calcular lucro da plataforma TOTAL (20% dos pedidos + 20% da taxa de entrega)
        const allCompletedOrders = await Order.findAll({
            where: { status: 'completed' },
            attributes: ['subtotal', 'deliveryFee']
        });
        
        let platformRevenue = 0;
        allCompletedOrders.forEach(order => {
            const subtotal = parseFloat(order.subtotal) || 0;
            const deliveryFee = parseFloat(order.deliveryFee) || 0;
            platformRevenue += (subtotal * 0.20) + (deliveryFee * 0.20);
        });
        
        // Lucro de hoje
        const todayCompletedOrders = await Order.findAll({
            where: {
                status: 'completed',
                createdAt: { [Op.gte]: today }
            },
            attributes: ['subtotal', 'deliveryFee']
        });
        
        let todayPlatformRevenue = 0;
        todayCompletedOrders.forEach(order => {
            const subtotal = parseFloat(order.subtotal) || 0;
            const deliveryFee = parseFloat(order.deliveryFee) || 0;
            todayPlatformRevenue += (subtotal * 0.20) + (deliveryFee * 0.20);
        });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers
                },
                restaurants: {
                    total: totalRestaurants,
                    active: activeRestaurants,
                    inactive: totalRestaurants - activeRestaurants
                },
                deliveries: {
                    total: totalDeliveries,
                    active: activeDeliveries,
                    inactive: totalDeliveries - activeDeliveries
                },
                orders: {
                    total: totalOrders,
                    completed: completedOrders,
                    today: todayOrdersCount
                },
                revenue: {
                    total: totalRevenue || 0,
                    today: todayRevenue || 0,
                    platformTotal: platformRevenue,
                    platformToday: todayPlatformRevenue
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
};

// Listar todos os restaurantes
exports.getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.findAll({
            order: [['createdAt', 'DESC']]
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

// Ativar/Desativar restaurante
exports.toggleRestaurantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const restaurant = await Restaurant.findByPk(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        await restaurant.update({ isActive });

        res.json({
            success: true,
            message: `Restaurante ${isActive ? 'ativado' : 'desativado'} com sucesso`,
            data: restaurant
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
};

// Listar todos os entregadores
exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: deliveries
        });
    } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar entregadores',
            error: error.message
        });
    }
};

// Ativar/Desativar entregador
exports.toggleDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const delivery = await Delivery.findByPk(id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Entregador não encontrado'
            });
        }

        await delivery.update({ isActive });

        res.json({
            success: true,
            message: `Entregador ${isActive ? 'ativado' : 'desativado'} com sucesso`,
            data: delivery
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
};

// Listar todos os pedidos
exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        
        const whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name', 'icon']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Delivery,
                    as: 'delivery',
                    attributes: ['id', 'name', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos',
            error: error.message
        });
    }
};

// Gráfico de receita (últimos 7 dias)
exports.getRevenueChart = async (req, res) => {
    try {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const dayRevenue = await Order.sum('total', {
                where: {
                    status: 'completed',
                    createdAt: {
                        [Op.gte]: date,
                        [Op.lt]: nextDay
                    }
                }
            });
            
            const dayOrders = await Order.findAll({
                where: {
                    status: 'completed',
                    createdAt: {
                        [Op.gte]: date,
                        [Op.lt]: nextDay
                    }
                },
                attributes: ['subtotal', 'deliveryFee']
            });
            
            let platformRevenue = 0;
            dayOrders.forEach(order => {
                const subtotal = parseFloat(order.subtotal) || 0;
                const deliveryFee = parseFloat(order.deliveryFee) || 0;
                platformRevenue += (subtotal * 0.20) + (deliveryFee * 0.20);
            });
            
            last7Days.push({
                date: date.toISOString().split('T')[0],
                revenue: dayRevenue || 0,
                platformRevenue: platformRevenue
            });
        }

        res.json({
            success: true,
            data: last7Days
        });
    } catch (error) {
        console.error('Erro ao buscar gráfico:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar gráfico',
            error: error.message
        });
    }
};
// 🆕 LISTAR PEDIDOS PENDENTES DE APROVAÇÃO
exports.getPendingOrders = async (req, res) => {
    try {
        const pendingOrders = await Order.findAll({
            where: {
                status: 'pending_admin_approval',
                requiresAdminApproval: true
            },
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name', 'icon', 'phone', 'image_url']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: pendingOrders
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos pendentes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos pendentes',
            error: error.message
        });
    }
};

// 🆕 APROVAR PEDIDO
exports.approveOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (order.status !== 'pending_admin_approval') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido não está aguardando aprovação'
            });
        }

        // Atualizar pedido
        await order.update({
            status: 'pending',
            requiresAdminApproval: false,
            adminApprovedAt: new Date(),
            adminApprovedBy: adminId
        });

        // 🔔 NOTIFICAR RESTAURANTE
        const io = req.app.get('io');
        io.to(`restaurant_${order.restaurantId}`).emit('newOrder', order);

        console.log(`✅ Pedido #${id} aprovado e enviado ao restaurante ${order.restaurantId}`);

        res.json({
            success: true,
            message: 'Pedido aprovado e enviado ao restaurante',
            data: order
        });
    } catch (error) {
        console.error('Erro ao aprovar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar pedido',
            error: error.message
        });
    }
};

// 🆕 REJEITAR PEDIDO
exports.rejectOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Motivo da rejeição é obrigatório'
            });
        }

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (order.status !== 'pending_admin_approval') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido não está aguardando aprovação'
            });
        }

        // Atualizar pedido
        await order.update({
            status: 'cancelled',
            requiresAdminApproval: false,
            rejectionReason: reason,
            adminApprovedBy: adminId
        });

        console.log(`❌ Pedido #${id} rejeitado pelo admin`);

        res.json({
            success: true,
            message: 'Pedido rejeitado',
            data: order
        });
    } catch (error) {
        console.error('Erro ao rejeitar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar pedido',
            error: error.message
        });
    }
};