const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Restaurant = sequelize.define('Restaurant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: '🍽️'
    },
    image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    cuisine: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0.0,
        validate: {
            min: 0,
            max: 5
        }
    },
    totalRatings: { 
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    minTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
    },
    maxTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 40
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // ========================================
    // 🆕 NOVOS CAMPOS PARA HORÁRIO DE FUNCIONAMENTO
    // ========================================
    isOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Status atual do restaurante (aberto/fechado)'
    },
    openingTime: {
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue: '08:00',
        validate: {
            is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        },
        comment: 'Horário de abertura (formato HH:MM)'
    },
    closingTime: {
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue: '22:00',
        validate: {
            is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        },
        comment: 'Horário de fechamento (formato HH:MM)'
    },
    autoSchedule: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Ativar abertura/fechamento automático baseado no horário'
    }
}, {
    tableName: 'restaurants',
    timestamps: true,
    hooks: {
        beforeCreate: async (restaurant) => {
            if (restaurant.password) {
                restaurant.password = await bcrypt.hash(restaurant.password, 10);
            }
        },
        beforeUpdate: async (restaurant) => {
            if (restaurant.changed('password')) {
                restaurant.password = await bcrypt.hash(restaurant.password, 10);
            }
        }
    }
});

// Método para comparar senha
Restaurant.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ========================================
// 🆕 MÉTODO PARA VERIFICAR SE DEVE ESTAR ABERTO
// ========================================
Restaurant.prototype.checkSchedule = function() {
    if (!this.autoSchedule || !this.openingTime || !this.closingTime) {
        return this.isOpen; // Retorna status manual
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const opening = this.openingTime;
    const closing = this.closingTime;

    // Verificar se está dentro do horário de funcionamento
    if (closing > opening) {
        // Horário normal (ex: 08:00 - 22:00)
        return currentTime >= opening && currentTime < closing;
    } else {
        // Horário que cruza meia-noite (ex: 22:00 - 02:00)
        return currentTime >= opening || currentTime < closing;
    }
};

module.exports = Restaurant;