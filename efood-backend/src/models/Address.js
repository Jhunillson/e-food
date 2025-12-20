const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: false // Ex: Casa, Trabalho
    },
    province: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    municipality: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    street: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    number: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    complement: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    neighborhood: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'addresses',
    timestamps: true
});

// Relacionamento: Um usuário tem muitos endereços
//User.hasMany(Address, { 
 //   foreignKey: 'userId',
   // as: 'addresses'
//});

//Address.belongsTo(User, { 
   // foreignKey: 'userId',
    //as: 'user'
//});

module.exports = Address;