import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Helper to calculate loan metrics
const calculateLoanMetrics = (loan: any) => {
  const installmentsRemaining = loan.totalInstallments - loan.paidInstallments;
  const installmentValue = loan.totalAmount / loan.totalInstallments;
  const remainingAmount = loan.totalAmount - (loan.paidInstallments * installmentValue);
  const status = installmentsRemaining <= 0 ? 'QUITADO' : 'ATIVO';

  return {
    ...loan,
    installmentsRemaining: Math.max(0, installmentsRemaining),
    installmentValue,
    remainingAmount: Math.max(0, remainingAmount),
    status
  };
};

// GET all loans
router.get('/', async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        employee: {
          include: { company: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedLoans = loans.map(calculateLoanMetrics);
    res.json(enrichedLoans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// POST create loan
router.post('/', async (req, res) => {
  try {
    const { employeeId, source, loanDate, totalAmount, totalInstallments, startDiscountDate, observations } = req.body;
    
    const loan = await prisma.loan.create({
      data: {
        employeeId,
        source,
        loanDate: new Date(loanDate),
        totalAmount: Number(totalAmount),
        totalInstallments: Number(totalInstallments),
        paidInstallments: 0,
        startDiscountDate: new Date(startDiscountDate),
        observations
      }
    });
    
    res.status(201).json(calculateLoanMetrics(loan));
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create loan', details: error.message });
  }
});

// PUT update loan
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source, loanDate, totalAmount, totalInstallments, paidInstallments, startDiscountDate, observations } = req.body;

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        source,
        loanDate: new Date(loanDate),
        totalAmount: Number(totalAmount),
        totalInstallments: Number(totalInstallments),
        paidInstallments: Number(paidInstallments),
        startDiscountDate: new Date(startDiscountDate),
        observations
      }
    });

    res.json(calculateLoanMetrics(loan));
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update loan', details: error.message });
  }
});

// DELETE loan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.loan.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete loan' });
  }
});

export default router;
