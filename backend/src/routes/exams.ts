import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all exams with auto-calculated status
router.get('/', async (req, res) => {
  try {
    const exams = await prisma.medicalExam.findMany({
      include: {
        employee: {
          include: {
            company: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    // Calculate status dynamically
    const examsWithStatus = exams.map((exam: any) => {
      const dueDate = new Date(exam.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'EM DIA';
      if (diffDays < 0) {
        status = 'VENCIDO';
      } else if (diffDays <= 30) {
        status = 'PRÓXIMO A VENCER';
      }

      return {
        ...exam,
        status
      };
    });

    res.json(examsWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medical exams' });
  }
});

// POST create new exam
router.post('/', async (req, res) => {
  try {
    const { employeeId, lastExamDate, dueDate, observations } = req.body;
    
    const exam = await prisma.medicalExam.create({
      data: {
        employeeId,
        lastExamDate: new Date(lastExamDate),
        dueDate: new Date(dueDate),
        observations
      }
    });
    
    res.status(201).json(exam);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create exam', details: error.message });
  }
});

// PUT update exam
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lastExamDate, dueDate, observations } = req.body;

    const exam = await prisma.medicalExam.update({
      where: { id },
      data: {
        lastExamDate: new Date(lastExamDate),
        dueDate: new Date(dueDate),
        observations
      }
    });

    res.json(exam);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update exam', details: error.message });
  }
});

// DELETE exam
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.medicalExam.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete exam' });
  }
});

export default router;
