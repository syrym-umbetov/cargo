"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const joi_1 = __importDefault(require("joi"));
const index_1 = require("../index");
const router = (0, express_1.Router)();
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('admin', 'user').default('user')
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
const clientLoginSchema = joi_1.default.object({
    clientCode: joi_1.default.string().required(),
    phoneLast4: joi_1.default.string().length(4).required()
});
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password, role } = value;
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await index_1.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
        // Simple token for now
        const token = `simple-token-${user.id}-${Date.now()}`;
        res.status(201).json({
            user,
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email, password } = value;
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Simple token for now
        const token = `simple-token-${user.id}-${Date.now()}`;
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/client-login', async (req, res) => {
    try {
        const { error, value } = clientLoginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { clientCode, phoneLast4 } = value;
        // Найти клиента по коду
        const client = await index_1.prisma.client.findUnique({
            where: { clientCode },
            include: { user: true }
        });
        if (!client) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Проверить последние 4 цифры телефона
        const clientPhoneLast4 = client.phone.slice(-4);
        if (clientPhoneLast4 !== phoneLast4) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Если у клиента еще нет пользователя, создать его
        let user = client.user;
        if (!user) {
            // Создать пользователя для клиента
            const defaultPassword = await bcryptjs_1.default.hash(clientCode + phoneLast4, 10);
            user = await index_1.prisma.user.create({
                data: {
                    email: `${clientCode}@client.local`,
                    passwordHash: defaultPassword,
                    role: 'client',
                    clientId: client.id
                }
            });
        }
        // Генерировать простой токен
        const token = `simple-token-${user.id}-${Date.now()}`;
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                clientId: client.id,
                createdAt: user.createdAt
            },
            client: {
                id: client.id,
                clientCode: client.clientCode,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address
            },
            token
        });
    }
    catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth-simple.js.map