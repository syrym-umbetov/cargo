"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const itemCreateSchema = joi_1.default.object({
    clientId: joi_1.default.number().required(),
    productCode: joi_1.default.string().required(),
    arrivalDate: joi_1.default.date().required(),
    quantity: joi_1.default.number().integer().min(1).default(1),
    weight: joi_1.default.number().positive().optional(),
    priceUsd: joi_1.default.number().positive().optional(),
    exchangeRate: joi_1.default.number().positive().optional(),
    amountKzt: joi_1.default.number().positive().optional(),
    costPrice: joi_1.default.number().positive().optional(),
    margin: joi_1.default.number().optional(),
    notes: joi_1.default.string().optional()
});
const itemUpdateSchema = joi_1.default.object({
    clientId: joi_1.default.number().optional(),
    productCode: joi_1.default.string().optional(),
    arrivalDate: joi_1.default.date().optional(),
    quantity: joi_1.default.number().integer().min(1).optional(),
    weight: joi_1.default.number().positive().optional(),
    priceUsd: joi_1.default.number().positive().optional(),
    exchangeRate: joi_1.default.number().positive().optional(),
    amountKzt: joi_1.default.number().positive().optional(),
    costPrice: joi_1.default.number().positive().optional(),
    margin: joi_1.default.number().optional(),
    notes: joi_1.default.string().optional()
});
router.use(auth_1.authenticateToken);
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, clientId, productCode } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (clientId)
            where.clientId = Number(clientId);
        if (productCode)
            where.productCode = { contains: String(productCode) };
        const [items, total] = await Promise.all([
            index_1.prisma.item.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    client: {
                        select: {
                            id: true,
                            clientCode: true,
                            name: true,
                            phone: true
                        }
                    }
                }
            }),
            index_1.prisma.item.count({ where })
        ]);
        res.json({
            items,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await index_1.prisma.item.findUnique({
            where: { id: Number(id) },
            include: {
                client: true
            }
        });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    }
    catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = itemCreateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const clientExists = await index_1.prisma.client.findUnique({
            where: { id: value.clientId }
        });
        if (!clientExists) {
            return res.status(400).json({ error: 'Client not found' });
        }
        if (value.priceUsd && value.exchangeRate) {
            value.amountKzt = value.priceUsd * value.exchangeRate;
        }
        if (value.amountKzt && value.costPrice) {
            value.margin = value.amountKzt - value.costPrice;
        }
        const item = await index_1.prisma.item.create({
            data: value,
            include: {
                client: {
                    select: {
                        id: true,
                        clientCode: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = itemUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        if (value.priceUsd && value.exchangeRate) {
            value.amountKzt = value.priceUsd * value.exchangeRate;
        }
        if (value.amountKzt && value.costPrice) {
            value.margin = value.amountKzt - value.costPrice;
        }
        const item = await index_1.prisma.item.update({
            where: { id: Number(id) },
            data: value,
            include: {
                client: {
                    select: {
                        id: true,
                        clientCode: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });
        res.json(item);
    }
    catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.item.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=items.js.map