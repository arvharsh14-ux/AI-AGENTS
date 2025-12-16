import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const demoUserEmail = 'demo@example.com';
  const demoPassword = await bcrypt.hash('password123', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (existingUser) {
    console.log('Demo user already exists, skipping...');
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: demoUserEmail,
      password: demoPassword,
      name: 'Demo User',
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  const workflow = await prisma.workflow.create({
    data: {
      name: 'Example Workflow',
      description: 'A sample workflow to demonstrate the system',
      userId: user.id,
      isPublic: false,
    },
  });

  console.log(`✅ Created demo workflow: ${workflow.name}`);

  const workflowVersion = await prisma.workflowVersion.create({
    data: {
      workflowId: workflow.id,
      version: 1,
      isActive: true,
      definition: {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            data: { label: 'Start' },
          },
          {
            id: 'process',
            type: 'action',
            data: { label: 'Process Data' },
          },
          {
            id: 'end',
            type: 'result',
            data: { label: 'End' },
          },
        ],
        edges: [
          { source: 'start', target: 'process' },
          { source: 'process', target: 'end' },
        ],
      },
    },
  });

  console.log(`✅ Created workflow version: v${workflowVersion.version}`);

  const execution = await prisma.execution.create({
    data: {
      workflowVersionId: workflowVersion.id,
      status: 'completed',
      input: { message: 'Hello World' },
      output: { result: 'Success', processedAt: new Date().toISOString() },
      completedAt: new Date(),
    },
  });

  console.log(`✅ Created demo execution: ${execution.id}`);

  await prisma.executionLog.createMany({
    data: [
      {
        executionId: execution.id,
        level: 'info',
        message: 'Execution started',
      },
      {
        executionId: execution.id,
        level: 'info',
        message: 'Processing node: start',
      },
      {
        executionId: execution.id,
        level: 'info',
        message: 'Processing node: process',
      },
      {
        executionId: execution.id,
        level: 'info',
        message: 'Processing node: end',
      },
      {
        executionId: execution.id,
        level: 'info',
        message: 'Execution completed successfully',
      },
    ],
  });

  console.log('✅ Created execution logs');

  await prisma.subscription.create({
    data: {
      userId: user.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created demo subscription');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
