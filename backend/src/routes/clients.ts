import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const clientSchema = Joi.object({
  clientCode: Joi.string().required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional(),
  address: Joi.string().optional()
});

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // For SQLite, we need to use case-insensitive search differently
    const where = search
      ? {
          OR: [
            { name: { contains: String(search) } },
            { clientCode: { contains: String(search) } },
            { phone: { contains: String(search) } }
          ]
        }
      : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingClient = await prisma.client.findUnique({
      where: { clientCode: value.clientCode }
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Client code already exists' });
    }

    const client = await prisma.client.create({
      data: value
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = clientSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        clientCode: value.clientCode,
        NOT: { id: Number(id) }
      }
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Client code already exists' });
    }

    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: value
    });

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id: Number(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;