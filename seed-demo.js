const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to database...');

  // 1. Ensure client exists
  let client = await prisma.client.findFirst({
    where: { email: 's.connor@cyberdyne.io' },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Sarah Connor',
        companyName: 'Cyberdyne Systems',
        email: 's.connor@cyberdyne.io',
      },
    });
    console.log('Created client:', client.name);
  } else {
    console.log('Found existing client:', client.name);
  }

  // 2. Ensure contract exists
  const existing = await prisma.contract.findUnique({
    where: { publicToken: 'demo-contract-token-5000' },
  });

  if (existing) {
    console.log('Demo contract already exists with ID:', existing.id);
    return;
  }

  const contract = await prisma.contract.create({
    data: {
      clientId: client.id,
      title: 'Full-Stack Web & Mobile App Modernization',
      scopeDescription:
        '### Scope of Work\n- Complete PWA implementation with safe-area insets.\n- Neon PostgreSQL schema & cryptographic audit logging.\n- Responsive milestone calculation engine.',
      totalValue: 5000.0,
      currency: 'USD',
      status: 'SENT',
      publicToken: 'demo-contract-token-5000',
      milestones: {
        create: [
          {
            title: 'Project Discovery & UX Workflows',
            percentage: 25,
            amount: 1250,
            sortOrder: 1,
            description: 'Design system, wireframes, and database architecture.',
          },
          {
            title: 'Core App Engine & API Routes',
            percentage: 50,
            amount: 2500,
            sortOrder: 2,
            description: 'Neon DB integration, Next.js routes, and signing logic.',
          },
          {
            title: 'Testing, Deployment & Mobile Audit',
            percentage: 25,
            amount: 1250,
            sortOrder: 3,
            description: 'Lighthouse PWA audit, safe-area tests, and production handoff.',
          },
        ],
      },
    },
  });

  console.log('Created demo contract successfully with ID:', contract.id);
}

run()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });