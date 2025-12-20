const { Delivery, Order, Restaurant } = require('../models');
const { Op } = require('sequelize'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro de entregador
// Registro de entregador (SEM LOGIN AUTOMÁTICO)
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, vehicle, vehiclePlate } = req.body;

        // Verificar se já existe
        const existingDelivery = await Delivery.findOne({ where: { email } });
        if (existingDelivery) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar entregador (PENDENTE)
        const delivery = await Delivery.create({
            name,
            email,
            phone,
            password: hashedPassword,
            vehicle,
            vehiclePlate,
            isActive: false   // 👈 nasce bloqueado
        });

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso. Aguarde aprovação do administrador.'
        });
    } catch (error) {
        console.error('Erro ao registrar entregador:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar',
            error: error.message
        });
    }
};

// Login de entregador (COM BLOQUEIO POR APROVAÇÃO)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const delivery = await Delivery.findOne({ where: { email } });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Entregador não encontrado'
            });
        }

        const isValidPassword = await bcrypt.compare(password, delivery.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Senha incorreta'
            });
        }

        // Bloquear se não estiver aprovado
        if (!delivery.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Seu cadastro está pendente de aprovação pelo administrador.'
            });
        }

        // CORRIGIDO: type → role
        const token = jwt.sign(
            { id: delivery.id, role: 'delivery' },
            process.env.JWT_SECRET || 'seu_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                id: delivery.id,
                name: delivery.name,
                email: delivery.email,
                phone: delivery.phone,
                vehicle: delivery.vehicle,
                isOnline: delivery.isOnline,
                score: delivery.score,
                totalDeliveries: delivery.totalDeliveries,
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

// Atualizar status online/offline
exports.updateOnlineStatus = async (req, res) => {
    try {
        const deliveryId = req.user.id;
        const { isOnline, currentLocation } = req.body;

        const delivery = await Delivery.findByPk(deliveryId);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Entregador não encontrado'
            });
        }

        await delivery.update({
            isOnline,
            currentLocation: currentLocation || delivery.currentLocation
        });

        res.json({
            success: true,
            message: `Status atualizado para ${isOnline ? 'online' : 'offline'}`,
            data: {
                isOnline: delivery.isOnline
            }
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

// Buscar pedidos disponíveis
exports.getAvailableOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: 'delivering',
                deliveryStatus: 'waiting',
                deliveryId: null
            },
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon', 'phone', 'address']
            }],
            order: [['createdAt', 'ASC']]
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

// Aceitar pedido
exports.acceptOrder = async (req, res) => {
    try {
        const deliveryId = req.user.id;
        const { orderId } = req.params;

        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se já foi aceito
        if (order.deliveryId) {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi aceito por outro entregador'
            });
        }

        // Aceitar pedido
        await order.update({
            deliveryId,
            deliveryStatus: 'accepted',
            deliveryAcceptedAt: new Date()
        });

        // Atualizar total de entregas
        const delivery = await Delivery.findByPk(deliveryId);
        await delivery.update({
            totalDeliveries: delivery.totalDeliveries + 1
        });

        const orderWithDetails = await Order.findByPk(orderId, {
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon', 'phone', 'address']
            }]
        });

        res.json({
            success: true,
            message: 'Pedido aceito com sucesso',
            data: orderWithDetails
        });
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao aceitar pedido',
            error: error.message
        });
    }
};

// Ignorar pedido (diminui pontuação)
exports.ignoreOrder = async (req, res) => {
    try {
        const deliveryId = req.user.id;

        const delivery = await Delivery.findByPk(deliveryId);
        await delivery.update({
            score: delivery.score - 1
        });

        res.json({
            success: true,
            message: 'Pedido ignorado',
            data: {
                score: delivery.score
            }
        });
    } catch (error) {
        console.error('Erro ao ignorar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao ignorar pedido',
            error: error.message
        });
    }
};

// Atualizar status de entrega
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const deliveryId = req.user.id;
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        const order = await Order.findOne({
            where: {
                id: orderId,
                deliveryId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        const updateData = { deliveryStatus };

        if (deliveryStatus === 'picked_up') {
            updateData.deliveryPickedUpAt = new Date();
        } else if (deliveryStatus === 'delivered') {
            updateData.deliveryCompletedAt = new Date();
            updateData.status = 'completed';
            
            // Aumentar pontuação
            const delivery = await Delivery.findByPk(deliveryId);
            await delivery.update({
                score: delivery.score + 10
            });
        }

        await order.update(updateData);

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

// Obter pedidos do entregador (ativos e histórico)
exports.getMyOrders = async (req, res) => {
    try {
        const deliveryId = req.user.id;
        const { includeCompleted } = req.query;

        const whereClause = { deliveryId };
        
        if (includeCompleted === 'true') {
            // Incluir todos os pedidos (ativos e concluídos)
            whereClause.deliveryStatus = ['accepted', 'picked_up', 'on_way', 'delivered'];
        } else {
            // Apenas pedidos ativos
            whereClause.deliveryStatus = ['accepted', 'picked_up', 'on_way'];
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'icon', 'phone', 'address']
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

// Obter estatísticas do entregador
exports.getStats = async (req, res) => {
    try {
        const deliveryId = req.user.id;

        const delivery = await Delivery.findByPk(deliveryId);
        
        const completedToday = await Order.count({
            where: {
                deliveryId,
                deliveryStatus: 'delivered',
                deliveryCompletedAt: {
                    [Op.gte]: new Date().setHours(0, 0, 0, 0)
                }
            }
        });

        res.json({
            success: true,
            data: {
                name: delivery.name,
                score: delivery.score,
                totalDeliveries: delivery.totalDeliveries,
                completedToday,
                isOnline: delivery.isOnline
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