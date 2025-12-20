const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
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
      validate: { isEmail: true }
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
      validate: { min: 0, max: 5 }
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

    // 🕒 HORÁRIO DE FUNCIONAMENTO
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    openingTime: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: '08:00',
      validate: {
        is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    closingTime: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: '22:00',
      validate: {
        is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    autoSchedule: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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

  // 🔐 Comparar senha
  Restaurant.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // 🕒 Verificar se está aberto
  Restaurant.prototype.checkSchedule = function () {
    if (!this.autoSchedule || !this.openingTime || !this.closingTime) {
      return this.isOpen;
    }

    const now = new Date();
    const currentTime =
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const opening = this.openingTime;
    const closing = this.closingTime;

    if (closing > opening) {
      return currentTime >= opening && currentTime < closing;
    } else {
      return currentTime >= opening || currentTime < closing;
    }
  };

  return Restaurant;
};
