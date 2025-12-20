const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');



// ============================
// INICIALIZAR MODELS
// ============================
const User = require('./User')(sequelize, DataTypes);
const Restaurant = require('./Restaurant')(sequelize, DataTypes);
const MenuItem = require('./MenuItem')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const Address = require('./Address')(sequelize, DataTypes);
const Delivery = require('./Delivery')(sequelize, DataTypes);
const Admin = require('./Admin')(sequelize, DataTypes);

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

// ============================
// EXPORTS
// ============================
module.exports = {
  sequelize,
  User,
  Restaurant,
  MenuItem,
  Order,
  Address,
  Delivery,
  Admin
};
