import { Router } from 'express';
import { prisma } from '../prisma';
import multer from 'multer';
import * as xlsx from 'xlsx';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all companies for the dropdown
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// POST create new company
router.post('/companies', async (req, res) => {
  try {
    const { name, cnpj } = req.body;
    const company = await prisma.company.create({
      data: { 
        name, 
        cnpj: cnpj ? cnpj.trim() : undefined 
      }
    });
    res.status(201).json(company);
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(400).json({ error: 'Failed to create company', details: error.message });
  }
});

// PUT update company (checklists)
router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { admissionChecklist, dismissalChecklist } = req.body;
    
    const company = await prisma.company.update({
      where: { id },
      data: {
        admissionChecklist: admissionChecklist ? JSON.stringify(admissionChecklist) : undefined,
        dismissalChecklist: dismissalChecklist ? JSON.stringify(dismissalChecklist) : undefined
      }
    });
    res.json(company);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update company', details: error.message });
  }
});

// DELETE company
router.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const employeesCount = await prisma.employee.count({
      where: { companyId: id }
    });
    
    if (employeesCount > 0) {
      return res.status(400).json({ error: 'Não é possível excluir esta unidade pois existem colaboradores vinculados a ela.' });
    }
    
    await prisma.company.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete company', details: error.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: true,
        admissionProcess: true,
        dismissalProcess: true,
        medicalExams: true,
        loans: true,
        vacations: { include: { periods: true } }
      }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        company: true,
        admissionProcess: true,
        dismissalProcess: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// DELETE single employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete employee', details: error.message });
  }
});

// POST create new employee (Admissão)
router.post('/', async (req, res) => {
  try {
    const {
      name, cargo, rg, cpf, email, pixKey, leader, gender, hasChildren, companyId,
      admissionProcess
    } = req.body;

    const employee = await prisma.employee.create({
      data: {
        name,
        cargo,
        rg: rg || null,
        cpf: cpf ? String(cpf).replace(/\D/g, '') : cpf,
        email: email || null,
        pixKey: pixKey || null,
        leader: leader || null,
        gender: gender || null,
        hasChildren,
        company: {
          connect: { id: companyId }
        },
        admissionProcess: {
          create: admissionProcess || {}
        }
      },
      include: {
        company: true,
        admissionProcess: true
      }
    });

    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    res.status(400).json({ error: 'Failed to create employee', details: error.message });
  }
});

// POST import multiple employees via XLSX
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let successCount = 0;
    let errors = [];

    for (const row of data) {
      try {
        if (!row.Nome || !row.CPF || !row.Cargo || !row.EmpresaID) {
          errors.push(`Linha com dados faltando: ${JSON.stringify(row)}`);
          continue;
        }

        const cpf = String(row.CPF).replace(/\D/g, '');
        
        await prisma.employee.create({
          data: {
            name: String(row.Nome),
            cpf,
            cargo: String(row.Cargo),
            rg: row.RG ? String(row.RG) : null,
            email: row.Email ? String(row.Email) : null,
            company: {
              connect: { id: String(row.EmpresaID).trim() }
            },
            admissionProcess: { create: {} }
          }
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Erro ao importar ${row.Nome}: ${err.message}`);
      }
    }

    res.json({ success: true, imported: successCount, errors });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao processar arquivo', details: error.message });
  }
});

// PUT update employee dismissal process
router.put('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissalDate, checklist, observations, status: processStatus } = req.body;

    // Verify existing process
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { dismissalProcess: true }
    });

    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    let parsedChecklist = [];
    if (checklist) {
      parsedChecklist = typeof checklist === 'string' ? JSON.parse(checklist) : checklist;
    }

    const is100Percent = parsedChecklist.length > 0 && parsedChecklist.every((item: any) => item.checked);
    const newProcessStatus = is100Percent ? 'CONCLUIDO' : (processStatus || 'EM_ANDAMENTO');
    const newEmployeeStatus = is100Percent ? 'INATIVO' : 'EM_DESLIGAMENTO';

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        status: newEmployeeStatus,
        dismissalDate: dismissalDate ? new Date(dismissalDate) : employee.dismissalDate,
        dismissalProcess: {
          upsert: {
            create: {
              checklist: JSON.stringify(parsedChecklist),
              observations,
              status: newProcessStatus
            },
            update: {
              checklist: JSON.stringify(parsedChecklist),
              observations,
              status: newProcessStatus
            }
          }
        }
      },
      include: { dismissalProcess: true }
    });

    res.json(updatedEmployee);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: 'Failed to process dismissal', details: error.message });
  }
});

// GET turnover stats
router.get('/turnover-stats', async (req, res) => {
  try {
    const { companyId, leader, period } = req.query; // period = 6m, 12m, ytd
    
    let dateFilter: any = undefined;
    const now = new Date();
    
    if (period === '6m') {
      dateFilter = new Date(now.setMonth(now.getMonth() - 6));
    } else if (period === '12m') {
      dateFilter = new Date(now.setMonth(now.getMonth() - 12));
    } else if (period === 'ytd') {
      dateFilter = new Date(now.getFullYear(), 0, 1);
    }

    const whereAdmissions: any = {};
    const whereDismissals: any = { status: 'INATIVO', dismissalDate: { not: null } };

    if (companyId) {
      whereAdmissions.companyId = String(companyId);
      whereDismissals.companyId = String(companyId);
    }
    if (leader) {
      whereAdmissions.leader = { contains: String(leader) };
      whereDismissals.leader = { contains: String(leader) };
    }
    
    if (dateFilter) {
      whereAdmissions.admissionDate = { gte: dateFilter };
      whereDismissals.dismissalDate = { gte: dateFilter };
    }

    const admissionsList = await prisma.employee.findMany({
      where: whereAdmissions,
      select: { admissionDate: true }
    });

    const dismissalsList = await prisma.employee.findMany({
      where: whereDismissals,
      select: { dismissalDate: true }
    });

    // Group by month
    const monthsData: Record<string, { admissions: number, dismissals: number }> = {};

    admissionsList.forEach(emp => {
      const monthStr = emp.admissionDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthsData[monthStr]) monthsData[monthStr] = { admissions: 0, dismissals: 0 };
      monthsData[monthStr].admissions++;
    });

    dismissalsList.forEach(emp => {
      if (emp.dismissalDate) {
        const monthStr = emp.dismissalDate.toISOString().slice(0, 7); // YYYY-MM
        if (!monthsData[monthStr]) monthsData[monthStr] = { admissions: 0, dismissals: 0 };
        monthsData[monthStr].dismissals++;
      }
    });

    const chartData = Object.keys(monthsData).sort().map(month => ({
      name: month,
      admissions: monthsData[month].admissions,
      dismissals: monthsData[month].dismissals
    }));

    const totalAdmissions = admissionsList.length;
    const totalDismissals = dismissalsList.length;

    res.json({
      chartData,
      totalAdmissions,
      totalDismissals
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch turnover stats' });
  }
});

// GET dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalActive = await prisma.employee.count({ where: { status: 'ATIVO' } });
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });

    const now = new Date();
    const expiredExams = await prisma.medicalExam.count({
      where: {
        dueDate: { lt: now }
      }
    });

    const loans = await prisma.loan.findMany();
    let totalLoanAmount = 0;
    let activeLoansCount = 0;

    loans.forEach(loan => {
      totalLoanAmount += loan.totalAmount;
      const installmentsRemaining = loan.totalInstallments - loan.paidInstallments;
      if (installmentsRemaining > 0) {
        activeLoansCount++;
      }
    });

    // Vacations math
    const vacations = await prisma.vacation.findMany({ include: { periods: true } });
    let expiredVacations = 0;
    
    vacations.forEach(vac => {
      const consumedDays = vac.periods.reduce((acc: number, p: any) => acc + p.days, 0);
      const remainingDays = 30 - consumedDays;
      if (remainingDays > 0 && new Date(vac.limitDate) < now) {
        expiredVacations++;
      }
    });

    // Charts Data Generation
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const exams = await prisma.medicalExam.findMany();
    let examsVencidos = 0;
    let examsProximos = 0;
    let examsEmDia = 0;
    
    exams.forEach(exam => {
      if (exam.dueDate < now) examsVencidos++;
      else if (exam.dueDate <= thirtyDaysFromNow) examsProximos++;
      else examsEmDia++;
    });

    const examsChartData = [
      { name: 'Vencidos', value: examsVencidos, fill: '#ef4444' },
      { name: 'Próximos', value: examsProximos, fill: '#f59e0b' },
      { name: 'Em Dia', value: examsEmDia, fill: '#10b981' }
    ];

    const loansChartData = [
      { name: 'Ativos', value: activeLoansCount, fill: '#3b82f6' },
      { name: 'Quitados', value: loans.length - activeLoansCount, fill: '#10b981' }
    ];

    res.json({
      totalActive,
      recentEmployees,
      expiredExams,
      activeLoans: activeLoansCount,
      expiredVacations,
      totalLoanAmount,
      examsChartData,
      loansChartData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
