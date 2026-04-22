import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET global settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.globalSettings.findUnique({
      where: { id: 'GLOBAL' }
    });

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          id: 'GLOBAL',
          admissionChecklist: JSON.stringify([
            { id: '1', label: 'Cópia do RG/CPF', checked: false },
            { id: '2', label: 'Cópia do Comprovante de Residência', checked: false },
            { id: '3', label: 'Exame Admissional (ASO)', checked: false },
            { id: '4', label: 'Abertura de Conta Salário', checked: false },
            { id: '5', label: 'Entrega de Uniforme e EPIs', checked: false }
          ]),
          dismissalChecklist: JSON.stringify([
            { id: '1', label: 'Aviso Prévio', checked: false },
            { id: '2', label: 'Exame Demissional', checked: false },
            { id: '3', label: 'Pagamento de Verbas', checked: false },
            { id: '4', label: 'Homologação', checked: false },
            { id: '5', label: 'Devolução de Equipamentos', checked: false }
          ])
        }
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global settings' });
  }
});

// PUT update global settings
router.put('/', async (req, res) => {
  try {
    const { admissionChecklist, dismissalChecklist } = req.body;
    
    const settings = await prisma.globalSettings.upsert({
      where: { id: 'GLOBAL' },
      update: {
        admissionChecklist: admissionChecklist ? JSON.stringify(admissionChecklist) : undefined,
        dismissalChecklist: dismissalChecklist ? JSON.stringify(dismissalChecklist) : undefined
      },
      create: {
        id: 'GLOBAL',
        admissionChecklist: JSON.stringify(admissionChecklist || []),
        dismissalChecklist: JSON.stringify(dismissalChecklist || [])
      }
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update global settings' });
  }
});

export default router;
