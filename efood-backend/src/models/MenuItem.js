const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Restaurant = require('./Restaurant');

const MenuItem = sequelize.define('MenuItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    restaurantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'restaurants',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(50),
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
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'menu_items',
    timestamps: true
});



module.exports = MenuItem;