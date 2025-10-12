import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const itemSchema = Joi.object({
  clientId: Joi.number().required(),
  productCode: Joi.string().required(),
  arrivalDate: Joi.date().required(),
  quantity: Joi.number().integer().min(1).default(1),
  weight: Joi.number().positive().optional(),
  priceUsd: Joi.number().positive().optional(),
  exchangeRate: Joi.number().positive().optional(),
  amountKzt: Joi.number().positive().optional(),
  costPrice: Joi.number().positive().optional(),
  margin: Joi.number().optional(),
  notes: Joi.string().optional()
});

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, clientId, productCode } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (clientId) where.clientId = Number(clientId);
    if (productCode) where.productCode = { contains: String(productCode) };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
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
      prisma.item.count({ where })
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
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id: Number(id) },
      include: {
        client: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = itemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const clientExists = await prisma.client.findUnique({
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

    const item = await prisma.item.create({
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
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = itemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (value.priceUsd && value.exchangeRate) {
      value.amountKzt = value.priceUsd * value.exchangeRate;
    }

    if (value.amountKzt && value.costPrice) {
      value.margin = value.amountKzt - value.costPrice;
    }

    const item = await prisma.item.update({
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
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.item.delete({
      where: { id: Number(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;