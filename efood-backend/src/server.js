const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');


// Importar rotas
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addressRoutes = require('./routes/addressRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Carregando adminRoutes...');
console.log('adminRoutes type:', typeof adminRoutes);
console.log('adminRoutes:', adminRoutes);

// MIDDLEWARES
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ SERVER HTTP (SOCKET.IO)
const server = http.createServer(app);

// ✅ SOCKET.IO CONFIG
const io = new Server(server, {
    cors: { origin: "*" }
});

// ✅ DISPONIBILIZAR SOCKET NOS CONTROLLERS
app.set('io', io);

// ✅ CONEXÕES DE SOCKET
io.on('connection', (socket) => {
    console.log('🟢 Socket conectado:', socket.id);

    socket.on('joinRestaurant', (restaurantId) => {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`🍽️ Restaurante ${restaurantId} conectado ao socket`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Socket desconectado');
    });
});

// ROTA TESTE
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍔 API eFood com Socket está funcionando!',
        version: '1.1.0'
    });
});
console.log('📋 Registrando rotas do admin...');
app.use('/api/admin', adminRoutes);
console.log('✅ Rotas /api/admin registradas com sucesso');

// Logo APÓS app.get('/', ...) e ANTES de app.use('/api/admin', adminRoutes)
app.post('/api/test', (req, res) => {
    console.log('🧪 Rota de teste chamada');
    console.log('Body:', req.body);
    res.json({ 
        success: true, 
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    });
});
// ROTAS
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);

app.use('/api/address', addressRoutes);
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    console.log('📦 Body:', req.body);
    next();
});





// ROTA 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ERRO GLOBAL
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// INICIAR SERVIDOR
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // ADICIONE ESTA LINHA ABAIXO:
        // alter: true ajusta as tabelas se você mudar algo no model futuramente
        await sequelize.sync({ alter: true }); 
        console.log('✅ Tabelas sincronizadas/criadas com sucesso');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor com SOCKET.IO rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// START
startServer();

module.exports = app;
