const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

const User = require('./User');
const Restaurant = require('./Restaurant');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const Address = require('./Address');
const Delivery = require('./Delivery');
const Admin = require('./Admin'); // ✅ Adicionado aqui

// ============================
// ASSOCIAÇÕES ENTRE MODELS
// ============================

// USER 1:N ADDRESS
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// RESTAURANT 1:N MENU ITEMS
Restaurant.hasMany(MenuItem, { foreignKey: 'restaurantId', as: 'menuItems' });
MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// RESTAURANT 1:N ORDERS
Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'restaurantOrders' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// USER 1:N ORDERS
User.hasMany(Order, { foreignKey: 'userId', as: 'userOrders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DELIVERY 1:N ORDERS
Delivery.hasMany(Order, { foreignKey: 'deliveryId', as: 'deliveryOrders' });
Order.belongsTo(Delivery, { foreignKey: 'deliveryId', as: 'delivery' });


// Testar conexão com banco
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    throw error;
  }
};

// Sincronizar todos os models com o banco
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // Atualiza tabelas existentes
    console.log('✅ Tabelas do banco sincronizadas!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabelas:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  User,
  Restaurant,
  MenuItem,
  Order,
  Address,
  Delivery,
  Admin, // ✅ agora está exportado corretamente
};
