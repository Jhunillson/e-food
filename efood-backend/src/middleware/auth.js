const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware genérico para verificar token
exports.authenticateToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Middleware para usuários
exports.authenticateUser = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key');
        
        // CORRIGIDO: type → role
        if (decoded.role !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Middleware para restaurantes
exports.authenticateRestaurant = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key');
        
        // CORRIGIDO: type → role
        if (decoded.role !== 'restaurant') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Middleware para entregadores
exports.authenticateDelivery = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key');
        
        // CORRIGIDO: type → role
        if (decoded.role !== 'delivery') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado - Apenas entregadores'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Middleware para admin

exports.authenticateAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key');
        
        // ✅ ACEITAR admin OU super_admin
        if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado - Apenas administradores'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};