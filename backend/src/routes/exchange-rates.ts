import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const exchangeRateSchema = Joi.object({
  currencyFrom: Joi.string().length(3).default('USD'),
  currencyTo: Joi.string().length(3).default('KZT'),
  rate: Joi.number().positive().required(),
  date: Joi.date().required()
});

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { currencyFrom = 'USD', currencyTo = 'KZT', limit = 10 } = req.query;

    const rates = await prisma.exchangeRate.findMany({
      where: {
        currencyFrom: String(currencyFrom),
        currencyTo: String(currencyTo)
      },
      orderBy: { date: 'desc' },
      take: Number(limit)
    });

    res.json(rates);
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const { currencyFrom = 'USD', currencyTo = 'KZT' } = req.query;

    const latestRate = await prisma.exchangeRate.findFirst({
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
  } catch (error) {
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

    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        currencyFrom: value.currencyFrom,
        currencyTo: value.currencyTo,
        date: value.date
      }
    });

    if (existingRate) {
      const updatedRate = await prisma.exchangeRate.update({
        where: { id: existingRate.id },
        data: { rate: value.rate }
      });
      return res.json(updatedRate);
    }

    const rate = await prisma.exchangeRate.create({
      data: value
    });

    res.status(201).json(rate);
  } catch (error) {
    console.error('Create exchange rate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;