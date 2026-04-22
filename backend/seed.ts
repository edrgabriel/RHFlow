import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { cnpj: '12345678000199' },
    update: {},
    create: {
      name: 'Empresa X',
      cnpj: '12345678000199'
    }
  });
  console.log('Company created:', company);
}

main().catch(console.error).finally(() => prisma.$disconnect());
