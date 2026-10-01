import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Ensure a demo user exists to own the seeded records
  const user = await prisma.user.upsert({
    where: { email: 'demo@ratestack.app' },
    update: {},
    create: {
      email: 'demo@ratestack.app',
      name: 'Demo Architect',
    },
  });

  // 2. Ensure a demo client exists (using findFirst/create since email is not marked @unique)
  let client = await prisma.client.findFirst({
    where: { email: 'client@example.com' },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        userId: user.id,
        name: 'Acme Corporation',
        companyName: 'Acme Labs',
        email: 'client@example.com',
      },
    });
  }

  // 3. Create sample contract linked to user.id
  await prisma.contract.upsert({
    where: { publicToken: 'demo-sample-token-123' },
    update: {},
    create: {
      userId: user.id,
      clientId: client.id,
      title: 'Full-Stack Modernization & Cloud CI/CD',
      scopeDescription: 'Production architecture design, database migration, and Kubernetes GitOps delivery pipeline.',
      totalValue: 5000,
      currency: 'USD',
      status: 'SENT',
      publicToken: 'demo-sample-token-123',
      milestones: {
        create: [
          {
            title: 'Discovery & Schema Architecture',
            percentage: 40,
            amount: 2000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            sortOrder: 0,
          },
          {
            title: 'Production Deployment & Monitoring',
            percentage: 60,
            amount: 3000,
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            sortOrder: 1,
          },
        ],
      },
      auditLogs: {
        create: [
          {
            event: 'CONTRACT_CREATED',
            metadata: { note: 'Initial seed generation' },
          },
        ],
      },
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });