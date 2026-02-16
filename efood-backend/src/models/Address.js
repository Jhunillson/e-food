module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define('Address', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      label: {
        type: DataTypes.STRING(50),
        allowNull: false
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
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      }
    }, {
      tableName: 'addresses',
      timestamps: true
    });
  
    return Address;
};
