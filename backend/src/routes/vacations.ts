import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Helper to calculate vacation metrics
const calculateVacationMetrics = (vacation: any) => {
  const consumedDays = vacation.periods.reduce((acc: number, period: any) => acc + period.days, 0);
  const remainingDays = 30 - consumedDays;
  
  let status = 'NO PRAZO';
  if (remainingDays <= 0) {
    status = 'GOZADAS';
  } else if (new Date(vacation.limitDate) < new Date()) {
    status = 'VENCIDAS';
  }

  return {
    ...vacation,
    consumedDays,
    remainingDays: Math.max(0, remainingDays),
    status
  };
};

// GET all vacations
router.get('/', async (req, res) => {
  try {
    const vacations = await prisma.vacation.findMany({
      include: {
        employee: {
          include: { company: true }
        },
        periods: true
      },
      orderBy: { aquisitiveStart: 'desc' }
    });

    const enrichedVacations = vacations.map(calculateVacationMetrics);
    res.json(enrichedVacations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vacations' });
  }
});

// POST create vacation
router.post('/', async (req, res) => {
  try {
    const { employeeId, noticeDate, aquisitiveStart, aquisitiveEnd, limitDate, thirteenthAdvance, observations, periods } = req.body;
    
    const vacation = await prisma.vacation.create({
      data: {
        employeeId,
        noticeDate: noticeDate ? new Date(noticeDate) : null,
        aquisitiveStart: new Date(aquisitiveStart),
        aquisitiveEnd: new Date(aquisitiveEnd),
        limitDate: new Date(limitDate),
        thirteenthAdvance: Boolean(thirteenthAdvance),
        observations,
        periods: {
          create: periods?.map((p: any) => ({
            days: Number(p.days),
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate)
          })) || []
        }
      },
      include: {
        periods: true
      }
    });
    
    res.status(201).json(calculateVacationMetrics(vacation));
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create vacation', details: error.message });
  }
});

// PUT update vacation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { noticeDate, aquisitiveStart, aquisitiveEnd, limitDate, thirteenthAdvance, observations, periods } = req.body;

    // We must update the vacation and replace its periods
    // Since Prisma doesn't have an exact "replace" for one-to-many, we delete all and recreate
    await prisma.vacationPeriod.deleteMany({
      where: { vacationId: id }
    });

    const vacation = await prisma.vacation.update({
      where: { id },
      data: {
        noticeDate: noticeDate ? new Date(noticeDate) : null,
        aquisitiveStart: new Date(aquisitiveStart),
        aquisitiveEnd: new Date(aquisitiveEnd),
        limitDate: new Date(limitDate),
        thirteenthAdvance: Boolean(thirteenthAdvance),
        observations,
        periods: {
          create: periods?.map((p: any) => ({
            days: Number(p.days),
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate)
          })) || []
        }
      },
      include: {
        periods: true
      }
    });

    res.json(calculateVacationMetrics(vacation));
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update vacation', details: error.message });
  }
});

// DELETE vacation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vacation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete vacation' });
  }
});

export default router;
