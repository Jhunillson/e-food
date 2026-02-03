const jwt = require('jsonwebtoken');
const { User, Restaurant, Address } = require('../models');

require('dotenv').config();

// Gerar token JWT - CORRIGIDO: usar "role" em vez de "type"
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role }, // MUDOU: type → role
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Registro de Cliente
exports.registerUser = async (req, res) => {
    try {
        const { 
            name, email, phone, password,
            label,
            province, municipality, street, number, 
            complement, neighborhood, reference 
        } = req.body;

        // Verificar se usuário já existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'E-mail já cadastrado'
            });
        }

        // Criar usuário
        const user = await User.create({
            name,
            email,
            phone,
            password,
    
            province,
            municipality,
            street,
            number,
            complement,
            neighborhood,
            reference
        });


        const newAddress = await Address.create({
            userId: user.id, // Usa a variável 'user'
            label: label || "Principal",
            province,
            municipality,
            street,
            number,
            complement,
            neighborhood,
            reference,
            isDefault: true
        });

        // Gerar token
        const token = generateToken(user.id, 'user');

        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                province: user.province,
                municipality: user.municipality,
                street: user.street,
                number: user.number,
                complement: user.complement,
                neighborhood: user.neighborhood,
                reference: user.reference,
                token
            }
        });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar usuário',
            error: error.message
        });
    }
};

// Login de Cliente
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Verificar senha
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Gerar token
        const token = generateToken(user.id, 'user');

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer login',
            error: error.message
        });
    }
};

// Registro de Restaurante
exports.registerRestaurant = async (req, res) => {
    try {
        const { name, icon, image_url, category, cuisine, email, phone, address, password } = req.body;

        // Verificar se restaurante já existe
        const existingRestaurant = await Restaurant.findOne({ where: { email } });
        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'E-mail já cadastrado'
            });
        }

        // Validar que image_url foi fornecida
        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: 'Imagem do restaurante é obrigatória'
            });
        }

        // Criar restaurante
        const restaurant = await Restaurant.create({
            name,
            icon: icon || '🍽️',
            image_url: image_url,
            category,
            cuisine,
            email,
            phone,
            address,
            password,
             isActive: false
        });

        // Gerar token
        const token = generateToken(restaurant.id, 'restaurant');

        res.status(201).json({
            success: true,
            message: 'Restaurante cadastrado com sucesso',
            data: {
                id: restaurant.id,
                name: restaurant.name,
                icon: restaurant.icon,
                image_url: restaurant.image_url,
                category: restaurant.category,
                email: restaurant.email,
                token
            }
        });
    } catch (error) {
        console.error('Erro ao cadastrar restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar restaurante',
            error: error.message
        });
    }
};

// Login de Restaurante - CORRIGIDO
exports.loginRestaurant = async (req, res) => {
    const { email, password } = req.body;

    try {
        const restaurant = await Restaurant.findOne({ where: { email } });

        if (!restaurant) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        // Validar senha
        const match = await restaurant.comparePassword(password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        // Bloquear se não estiver aprovado
        if (!restaurant.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Seu restaurante está pendente de aprovação pelo administrador.'
            });
        }

        // CORRIGIDO: usar generateToken para consistência
        const token = generateToken(restaurant.id, 'restaurant');

        res.json({
            success: true,
            data: {
                id: restaurant.id,
                name: restaurant.name,
                email: restaurant.email,
                icon: restaurant.icon,
                image_url: restaurant.image_url,
                category: restaurant.category,
                cuisine: restaurant.cuisine,
                minTime: restaurant.minTime,
                maxTime: restaurant.maxTime,
                isActive: restaurant.isActive,
                token
            }
        });

    } catch (error) {
        console.error('Erro login restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no servidor',
            error: error.message
        });
    }
};

// Obter perfil do usuário autenticado - CORRIGIDO
exports.getProfile = async (req, res) => {
    try {
        const { id, role } = req.user;

        let profile;
        if (role === 'user') {
            profile = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: Address,
                        as: 'addresses',
                        attributes: [
                            'id',
                            'label',
                            'province',
                            'municipality',
                            'street',
                            'number',
                            'complement',
                            'neighborhood',
                            'reference',
                            'isDefault'
                        ]
                    }
                ]
            });
        } else if (role === 'restaurant') {
            profile = await Restaurant.findByPk(id, {
                attributes: { exclude: ['password'] }
            });
        }

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        res.json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar perfil',
            error: error.message
        });
    }
};
