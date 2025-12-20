// src/routes/addressRoutes.js (Ajuste Final)
const express = require('express');
const router = express.Router();

// ✅ A CORREÇÃO NO MIDDLEWARE: Importe a função específica que você precisa
const { authenticateUser } = require('../middleware/auth'); // Agora só importa a função

// Desestrutura as funções do controlador (esta parte já estava correta)
const {
    createAddress,
    getUserAddresses,
    updateAddress,
    deleteAddress
} = require('../controllers/addressController');
// -----------------------------------------------------------------

// Criar endereço
// Onde antes tinha 'authMiddleware', agora usa 'authenticateUser'
router.post('/', authenticateUser, createAddress);

// Listar endereços
router.get('/', authenticateUser, getUserAddresses);

// Atualizar endereço
router.put('/:id', authenticateUser, updateAddress);

// Remover endereço
router.delete('/:id', authenticateUser, deleteAddress);

module.exports = router;