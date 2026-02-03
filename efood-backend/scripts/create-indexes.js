const { sequelize } = require('../src/models');

const createIndexes = async () => {
    try {
        console.log('🔄 Criando índices otimizados...\n');
        
        // Índice 1: Restaurantes ativos ordenados por rating
        await sequelize.query('CREATE INDEX IF NOT EXISTS idx_restaurants_active_rating ON restaurants ("isActive", rating DESC)');
        console.log('✅ Índice 1/5: restaurants (isActive, rating)');
        
        // Índice 2: Restaurantes por categoria
        await sequelize.query('CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants (category, "isActive")');
        console.log('✅ Índice 2/5: restaurants (category, isActive)');
        
        // Índice 3: Restaurantes abertos
        await sequelize.query('CREATE INDEX IF NOT EXISTS idx_restaurants_open ON restaurants ("isOpen", "isActive")');
        console.log('✅ Índice 3/5: restaurants (isOpen, isActive)');
        
        // Índice 4: Menu items por restaurante
        await sequelize.query('CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items ("restaurantId", "isAvailable")');
        console.log('✅ Índice 4/5: menu_items (restaurantId, isAvailable)');
        
        // Índice 5: Menu items por categoria
        await sequelize.query('CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category, "isAvailable")');
        console.log('✅ Índice 5/5: menu_items (category, isAvailable)');
        
        console.log('\n🎉 Todos os índices criados com sucesso!');
        console.log('🚀 Agora reinicie o servidor e teste a velocidade!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
};

createIndexes();