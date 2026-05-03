import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all documents for an employee or candidate
router.get('/', async (req, res) => {
  try {
    const { employeeId, candidateId } = req.query;
    
    if (!employeeId && !candidateId) {
      return res.status(400).json({ error: 'Must provide employeeId or candidateId' });
    }

    const documents = await prisma.document.findMany({
      where: {
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
        ...(candidateId ? { candidateId: String(candidateId) } : {})
      },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        createdAt: true,
        // we do not fetch the actual data here to save bandwidth
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET download document
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      name: document.name,
      type: document.type,
      data: document.data // this is the base64 string
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// POST upload document
router.post('/', async (req, res) => {
  try {
    const { name, type, size, data, employeeId, candidateId } = req.body;
    
    const document = await prisma.document.create({
      data: {
        name,
        type,
        size: Number(size),
        data,
        employeeId: employeeId || null,
        candidateId: candidateId || null
      }
    });
    
    res.status(201).json({
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      createdAt: document.createdAt
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to upload document', details: error.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete document' });
  }
});

export default router;
