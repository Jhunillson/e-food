module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
  
      restaurantId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  
      deliveryId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
  
      items: {
        type: DataTypes.JSONB,
        allowNull: false
      },
  
      address: {
        type: DataTypes.JSONB,
        allowNull: false
      },
  
      payment: {
        type: DataTypes.JSONB,
        allowNull: false
      },
  
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
  
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 500.00
      },
  
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
  
      // 💰 DIVISÃO DE VALORES
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
  
      status: {
        type: DataTypes.ENUM(
          'pending_admin_approval',
          'pending',
          'preparing',
          'delivering',
          'completed',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
  
      clientName: {
        type: DataTypes.STRING,
        allowNull: true
      },
  
      clientPhone: {
        type: DataTypes.STRING,
        allowNull: true
      },
  
      clientAddress: {
        type: DataTypes.TEXT,
        allowNull: true
      },
  
      deliveryStatus: {
        type: DataTypes.ENUM(
          'waiting',
          'accepted',
          'picked_up',
          'on_way',
          'delivered'
        ),
        defaultValue: 'waiting'
      },
  
      deliveryAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
  
      deliveryPickedUpAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
  
      deliveryCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
  
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 }
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
        allowNull: true
      },
  
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      }
  
    }, {
      tableName: 'orders',
      timestamps: true,
  
      hooks: {
        beforeCreate: (order) => {
          const subtotal = parseFloat(order.subtotal || 0);
          const deliveryFee = parseFloat(order.deliveryFee || 0);
  
          order.restaurantAmount = (subtotal * 0.95).toFixed(2);
          order.deliveryAmount = deliveryFee.toFixed(2);
          order.platformFee = (subtotal * 0.05).toFixed(2);
        }
      }
    });
  
    return Order;
  };
  