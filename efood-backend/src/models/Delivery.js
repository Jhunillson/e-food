const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vehicle: {
        type: DataTypes.ENUM('motorcycle', 'bicycle', 'car'),
        allowNull: false
    },
    vehiclePlate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        defaultValue: '🛵'
    },
    isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalDeliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    currentLocation: {
        type: DataTypes.JSONB, // {lat, lng}
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'deliveries',
    timestamps: true
});

module.exports = Delivery;