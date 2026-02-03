const { Order, Restaurant, User, Delivery } = require('../models');
const { Op } = require('sequelize');

// Criar pedido
exports.createOrder = async (req, res) => {
    try {
        // Pegar userId do token (se existir)
        const userId = req.user ? req.user.id : null;
        
        console.log('📦 Criando pedido - UserId:', userId);
        
        const { restaurantId, items, address, payment, subtotal, deliveryFee, total } = req.body;

        // Verificar se restaurante existe
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante não encontrado'
            });
        }

        // Buscar dados do usuário (cliente)
        let clientName = 'Cliente';
        let clientPhone = '';
        
        if (userId) {
            const user = await User.findByPk(userId);
            if (user) {
                clientName = user.name;
                clientPhone = user.phone;
            }
        }

        // 🆕 TODOS OS PEDIDOS COMEÇAM AGUARDANDO APROVAÇÃO DO ADMIN
        const orderStatus = 'pending_admin_approval';

        // Criar pedido com dados do cliente
        const order = await Order.create({
            userId,
            restaurantId,
            items,
            address,
            payment,
            subtotal,
            deliveryFee,
            total,
            status: orderStatus,
            requiresAdminApproval: true,
            clientName,      
            clientPhone,     
            clientAddress: `${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}, ${address.neighborhood}, ${address.municipality}`
        });
        
        // ✅ NOTIFICAÇÃO EM TEMPO REAL PARA ADMIN
        const io = req.app.get('io');
        
        // 🔒 TODOS os pedidos vão primeiro para o ADMIN
        io.emit('newPendingApproval', order);

        console.log('🕒 Pedido aguardando aprovação do admin:', order.id);
        
        console.log('✅ Pedido criado com sucesso - ID:', order.id);

        res.status(201).json({
            success: true,
            message: 'Pedido criado! Aguardando aprovação administrativa.',
            data: order,
            requiresApproval: true
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar pedido',
            error: error.message
        });
    }
};

// Listar pedidos do usuário
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.findAll({
            where: { userId },
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon', 'phone']
            }],
            order: [['createdAt', 'DESC']]
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

// Listar pedidos do restaurante
exports.getRestaurantOrders = async (req, res) => {
    try {

        // ✅ Garantir autenticação válida
        if (!req.user || !req.user.id) {
            console.error('❌ Acesso sem autenticação de restaurante!');
            return res.status(401).json({
                success: false,
                message: 'Não autorizado. Faça login como restaurante.'
            });
        }

        const restaurantId = req.user.id;
        const { status, rated } = req.query;

        const whereClause = { restaurantId };

        if (status) {
            whereClause.status = status;
        }

        if (rated === 'true') {
            whereClause.rating = { [Op.ne]: null };
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'phone']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('🔥 ERRO INTERNO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar pedidos do restaurante',
            error: error.message
        });
    }
};

// Buscar pedido por ID (FUNÇÃO ÚNICA - REMOVIDA DUPLICAÇÃO)
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;
        const userType = req.user ? req.user.type : null;

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name', 'icon', 'phone']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'phone']
                },
                {
                    model: Delivery,
                    as: 'delivery',
                    attributes: ['id', 'name', 'phone', 'vehicle', 'vehiclePlate']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar permissão
        if (userType === 'user' && order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para ver este pedido'
            });
        }

        if (userType === 'restaurant' && order.restaurantId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para ver este pedido'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedido',
            error: error.message
        });
    }
};

// Atualizar status do pedido (apenas restaurante) - COM BLOQUEIO DE APROVAÇÃO ADMIN
exports.updateOrderStatus = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        // Validar status
        const validStatuses = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido'
            });
        }

        // Buscar pedido
        const order = await Order.findOne({
            where: { 
                id,
                restaurantId 
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // 🔒 BLOQUEIO: Restaurante não pode alterar pedido sem aprovação do admin
        if (order.status === 'pending_admin_approval') {
            return res.status(403).json({
                success: false,
                message: 'Pedido ainda aguarda aprovação do administrador. Você não pode alterar o status até que seja aprovado.'
            });
        }

        // Atualizar status
        await order.update({ status });

        // ✅ Notificação em tempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusUpdated', {
                orderId: order.id,
                status: order.status,
                restaurantId: order.restaurantId,
                userId: order.userId
            });
        }

        res.json({
            success: true,
            message: 'Status atualizado',
            data: order
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

// Estatísticas do restaurante
exports.getRestaurantStats = async (req, res) => {
    try {
        const restaurantId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Pedidos de hoje
        const todayOrders = await Order.count({
            where: {
                restaurantId,
                createdAt: {
                    [Op.gte]: today
                }
            }
        });

        // Faturamento de hoje
        const todayRevenue = await Order.sum('total', {
            where: {
                restaurantId,
                createdAt: {
                    [Op.gte]: today
                },
                status: {
                    [Op.ne]: 'cancelled'
                }
            }
        });

        // Total de pedidos
        const totalOrders = await Order.count({
            where: { restaurantId }
        });

        res.json({
            success: true,
            data: {
                todayOrders,
                todayRevenue: todayRevenue || 0,
                totalOrders
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

// Avaliar pedido
exports.rateOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;
        const { rating, comment } = req.body;

        // Validar rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Avaliação deve ser entre 1 e 5 estrelas'
            });
        }

        // Buscar pedido
        const order = await Order.findOne({
            where: { 
                id: orderId,
                userId: userId,
                status: 'completed'
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado ou não pode ser avaliado'
            });
        }

        // Verificar se já foi avaliado
        if (order.rating) {
            return res.status(400).json({
                success: false,
                message: 'Pedido já foi avaliado'
            });
        }

        // Salvar avaliação
        await order.update({
            rating: rating,
            ratingComment: comment || null,
            ratedAt: new Date()
        });

        // Recalcular rating do restaurante
        await updateRestaurantRating(order.restaurantId);

        res.json({
            success: true,
            message: 'Avaliação registrada com sucesso',
            data: order
        });
    } catch (error) {
        console.error('Erro ao avaliar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao avaliar pedido',
            error: error.message
        });
    }
};

// Função auxiliar para recalcular rating do restaurante
async function updateRestaurantRating(restaurantId) {
    try {
        // Buscar todas as avaliações do restaurante
        const orders = await Order.findAll({
            where: {
                restaurantId: restaurantId,
                status: 'completed',
                rating: {
                    [Op.ne]: null
                }
            },
            attributes: ['rating']
        });

        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) return;

        if (orders.length === 0) {
            // Se não tem avaliações, rating é 0
            await restaurant.update({ 
                rating: 0.0,
                totalRatings: 0
            });
            console.log(`✅ Restaurante ${restaurantId} sem avaliações (0.0)`);
            return;
        }

        // Calcular média
        const totalRating = orders.reduce((sum, order) => sum + order.rating, 0);
        const averageRating = (totalRating / orders.length).toFixed(1);

        // Atualizar restaurante
        await restaurant.update({ 
            rating: averageRating,
            totalRatings: orders.length
        });
        
        console.log(`✅ Rating do restaurante ${restaurantId} atualizado para ${averageRating} (${orders.length} avaliações)`);
    } catch (error) {
        console.error('Erro ao atualizar rating:', error);
    }
}