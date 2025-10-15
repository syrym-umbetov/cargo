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
const exchangeRateSchema = joi_1.default.object({
    currencyFrom: joi_1.default.string().length(3).default('USD'),
    currencyTo: joi_1.default.string().length(3).default('KZT'),
    rate: joi_1.default.number().positive().required(),
    date: joi_1.default.date().required()
});
router.use(auth_1.authenticateToken);
router.get('/', async (req, res) => {
    try {
        const { currencyFrom = 'USD', currencyTo = 'KZT', limit = 10 } = req.query;
        const rates = await index_1.prisma.exchangeRate.findMany({
            where: {
                currencyFrom: String(currencyFrom),
                currencyTo: String(currencyTo)
            },
            orderBy: { date: 'desc' },
            take: Number(limit)
        });
        res.json(rates);
    }
    catch (error) {
        console.error('Get exchange rates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/latest', async (req, res) => {
    try {
        const { currencyFrom = 'USD', currencyTo = 'KZT' } = req.query;
        const latestRate = await index_1.prisma.exchangeRate.findFirst({
            where: {
                currencyFrom: String(currencyFrom),
                currencyTo: String(currencyTo)
            },
            orderBy: { date: 'desc' }
        });
        if (!latestRate) {
            return res.status(404).json({ error: 'Exchange rate not found' });
        }
        res.json(latestRate);
    }
    catch (error) {
        console.error('Get latest exchange rate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = exchangeRateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const existingRate = await index_1.prisma.exchangeRate.findFirst({
            where: {
                currencyFrom: value.currencyFrom,
                currencyTo: value.currencyTo,
                date: value.date
            }
        });
        if (existingRate) {
            const updatedRate = await index_1.prisma.exchangeRate.update({
                where: { id: existingRate.id },
                data: { rate: value.rate }
            });
            return res.json(updatedRate);
        }
        const rate = await index_1.prisma.exchangeRate.create({
            data: value
        });
        res.status(201).json(rate);
    }
    catch (error) {
        console.error('Create exchange rate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-rates.js.map