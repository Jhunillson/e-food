const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Restaurant = require('./Restaurant');
const Delivery = require('./Delivery');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'restaurants', key: 'id' }, onDelete: 'CASCADE' },
    items: { type: DataTypes.JSONB, allowNull: false },
    address: { type: DataTypes.JSONB, allowNull: false },
    payment: { type: DataTypes.JSONB, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    deliveryFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 500.00 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    
    // 💰 DIVISÃO DE VALORES (CORRIGIDO)
    restaurantAmount: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true,
        comment: '95% do subtotal - Valor do restaurante'
    },
    deliveryAmount: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true,
        comment: '100% da taxa de entrega - Valor do entregador'
    },
    platformFee: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true,
        comment: '5% do subtotal - Comissão da plataforma'
    },
    
    // 🆕 STATUS ATUALIZADO COM NOVO VALOR
    status: { 
        type: DataTypes.ENUM('pending_admin_approval', 'pending', 'preparing', 'delivering', 'completed', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'pending' 
    },
    
    clientName: { type: DataTypes.STRING, allowNull: true },
    clientPhone: { type: DataTypes.STRING, allowNull: true },
    clientAddress: { type: DataTypes.TEXT, allowNull: true },
    deliveryId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'deliveries', key: 'id' }, onDelete: 'SET NULL' },
    deliveryStatus: { type: DataTypes.ENUM('waiting', 'accepted', 'picked_up', 'on_way', 'delivered'), defaultValue: 'waiting' },
    deliveryAcceptedAt: { type: DataTypes.DATE, allowNull: true },
    deliveryPickedUpAt: { type: DataTypes.DATE, allowNull: true },
    deliveryCompletedAt: { type: DataTypes.DATE, allowNull: true },
    
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    ratingComment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ratedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // 🆕 CAMPOS DE APROVAÇÃO ADMIN
    requiresAdminApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    adminApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adminApprovedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'admins',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'orders',
    timestamps: true,
    hooks: {
        // 🎯 CALCULAR DIVISÃO CORRETAMENTE
        beforeCreate: (order) => {
            const subtotal = parseFloat(order.subtotal);
            const deliveryFee = parseFloat(order.deliveryFee);
            
            // Restaurante recebe 95% do SUBTOTAL (dos itens)
            order.restaurantAmount = (subtotal * 0.95).toFixed(2);
            
            // Entregador recebe 100% da TAXA DE ENTREGA
            order.deliveryAmount = deliveryFee.toFixed(2);
            
            // Plataforma recebe 5% do SUBTOTAL
            order.platformFee = (subtotal * 0.05).toFixed(2);
            
            console.log('💰 Divisão calculada:', {
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: order.total,
                restaurante: order.restaurantAmount + ' (95% do subtotal)',
                entregador: order.deliveryAmount + ' (100% da taxa de entrega)',
                plataforma: order.platformFee + ' (5% do subtotal)'
            });
        }
    }
});

module.exports = Order;