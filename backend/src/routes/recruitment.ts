import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all recruitment links
router.get('/', async (req, res) => {
  try {
    const links = await prisma.recruitmentLink.findMany({
      include: {
        company: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recruitment links' });
  }
});

// GET single link for public form
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const link = await prisma.recruitmentLink.findUnique({
      where: { id },
      include: { company: true }
    });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    if (!link.active) {
      return res.status(403).json({ error: 'This recruitment link is no longer active' });
    }

    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch link data' });
  }
});

// POST create link
router.post('/', async (req, res) => {
  try {
    const { title, companyId, requireDocuments, requireMbti, description, salaryInfo, customQuestions } = req.body;
    
    const link = await prisma.recruitmentLink.create({
      data: {
        title,
        companyId,
        requireDocuments: Boolean(requireDocuments),
        requireMbti: Boolean(requireMbti),
        description: description || null,
        salaryInfo: salaryInfo || null,
        customQuestions: customQuestions ? JSON.stringify(customQuestions) : null
      },
      include: { company: true }
    });
    
    res.status(201).json(link);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create recruitment link', details: error.message });
  }
});

// PUT update link
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, active, requireDocuments, requireMbti, description, salaryInfo, customQuestions } = req.body;

    const link = await prisma.recruitmentLink.update({
      where: { id },
      data: {
        title,
        active: Boolean(active),
        requireDocuments: Boolean(requireDocuments),
        requireMbti: Boolean(requireMbti),
        description: description || null,
        salaryInfo: salaryInfo || null,
        customQuestions: customQuestions ? JSON.stringify(customQuestions) : null
      },
      include: { company: true }
    });

    res.json(link);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update link', details: error.message });
  }
});

// DELETE link
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recruitmentLink.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete link' });
  }
});

export default router;
