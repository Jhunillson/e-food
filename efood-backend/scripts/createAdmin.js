const { Admin, sequelize } = require('../src/models');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Sincronizar tabelas (criar se não existir)
        await sequelize.sync();
        console.log('✅ Tabelas sincronizadas');

        // Verificar se já existe admin
        const existingAdmin = await Admin.findOne({ 
            where: { email: 'admin@efood.com' } 
        });

        if (existingAdmin) {
            console.log('⚠️  Admin já existe!');
            console.log('📧 Email: admin@efood.com');
            console.log('🔑 Senha: admin123');
            process.exit(0);
        }

        // Criar senha hash
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Criar admin
        const admin = await Admin.create({
            name: 'Admin Principal',
            email: 'admin@efood.com',
            password: hashedPassword,
            role: 'super_admin'
        });

        console.log('✅ Admin criado com sucesso!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Senha: admin123');
        console.log('👤 Nome:', admin.name);
        console.log('🎭 Role:', admin.role);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar admin:', error);
        process.exit(1);
    }
}

createAdmin();