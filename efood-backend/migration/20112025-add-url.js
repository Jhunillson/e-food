'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar image_url na tabela restaurants
    await queryInterface.addColumn('restaurants', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });

    // Adicionar image_url na tabela menu_items
    await queryInterface.addColumn('menu_items', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });

    console.log('✅ Colunas image_url adicionadas com sucesso!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('restaurants', 'image_url');
    await queryInterface.removeColumn('menu_items', 'image_url');
    
    console.log('✅ Colunas image_url removidas com sucesso!');
  }
};