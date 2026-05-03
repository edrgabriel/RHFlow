import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await prisma.preCandidate.findMany({
      include: {
        recruitmentLink: {
          include: { company: true }
        },
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST submit candidate (public route)
router.post('/', async (req, res) => {
  try {
    const { recruitmentLinkId, name, email, cpf, phone, mbti, documents, customAnswers } = req.body;
    
    // Check if link is valid
    const link = await prisma.recruitmentLink.findUnique({ where: { id: recruitmentLinkId } });
    if (!link || !link.active) {
      return res.status(400).json({ error: 'Invalid or inactive recruitment link' });
    }

    const candidate = await prisma.preCandidate.create({
      data: {
        recruitmentLinkId,
        name,
        email,
        cpf: cpf.replace(/\D/g, ''), // sanitize CPF
        phone,
        mbti,
        customAnswers: customAnswers ? JSON.stringify(customAnswers) : null,
        documents: {
          create: documents?.map((doc: any) => ({
            name: doc.name,
            type: doc.type,
            size: doc.size,
            data: doc.data
          })) || []
        }
      }
    });
    
    res.status(201).json(candidate);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      return res.status(400).json({ error: 'Já existe um candidato cadastrado com este CPF.' });
    }
    res.status(400).json({ error: 'Failed to submit candidacy', details: error.message });
  }
});

// POST approve candidate and turn into employee
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { cargo, admissionDate } = req.body;

    const candidate = await prisma.preCandidate.findUnique({
      where: { id },
      include: { 
        recruitmentLink: true,
        documents: true 
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Convert to employee
    const newEmployee = await prisma.employee.create({
      data: {
        name: candidate.name,
        cargo,
        cpf: candidate.cpf,
        email: candidate.email,
        mbti: candidate.mbti,
        status: 'ATIVO',
        admissionDate: new Date(admissionDate || new Date()),
        companyId: candidate.recruitmentLink.companyId,
      }
    });

    // Move documents from candidate to employee
    if (candidate.documents.length > 0) {
      await prisma.document.updateMany({
        where: { candidateId: id },
        data: { 
          candidateId: null,
          employeeId: newEmployee.id
        }
      });
    }

    // Mark candidate as approved
    await prisma.preCandidate.update({
      where: { id },
      data: { status: 'APROVADO' }
    });

    res.json(newEmployee);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      return res.status(400).json({ error: 'Este CPF já está registrado como um Colaborador no sistema.' });
    }
    res.status(400).json({ error: 'Failed to approve candidate', details: error.message });
  }
});

// DELETE candidate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.preCandidate.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete candidate' });
  }
});

export default router;
