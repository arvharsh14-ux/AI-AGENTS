import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  const demoUserEmail = 'demo@example.com';
  const demoPassword = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: demoUserEmail,
        password: demoPassword,
        name: 'Demo User',
      },
    });
    console.log(`✅ Created demo user: ${user.email}`);
  } else {
    console.log('Demo user already exists');
  }

  // Create Billing Plans
  let billingPlan = await prisma.billingPlan.findFirst({ where: { name: 'Free' } });
  if (!billingPlan) {
    billingPlan = await prisma.billingPlan.create({
      data: {
        name: 'Free',
        price: 0,
        maxExecutionsPerMonth: 1000,
        maxConnectors: 5,
        maxRunMinutesPerMonth: 100,
        maxWorkflows: 10,
        maxTeamMembers: 1,
      },
    });
    console.log('✅ Created billing plan: Free');
  }

  let proPlan = await prisma.billingPlan.findFirst({ where: { name: 'Pro' } });
  if (!proPlan) {
    proPlan = await prisma.billingPlan.create({
      data: {
        name: 'Pro',
        price: 4900, // $49/month
        stripePriceId: 'price_pro_monthly',
        maxExecutionsPerMonth: 50000,
        maxConnectors: 50,
        maxRunMinutesPerMonth: 5000,
        maxWorkflows: 100,
        maxTeamMembers: 10,
      },
    });
    console.log('✅ Created billing plan: Pro');
  }

  let enterprisePlan = await prisma.billingPlan.findFirst({ where: { name: 'Enterprise' } });
  if (!enterprisePlan) {
    enterprisePlan = await prisma.billingPlan.create({
      data: {
        name: 'Enterprise',
        price: 19900, // $199/month
        stripePriceId: 'price_enterprise_monthly',
        maxExecutionsPerMonth: 500000,
        maxConnectors: 500,
        maxRunMinutesPerMonth: 50000,
        maxWorkflows: 1000,
        maxTeamMembers: 100,
      },
    });
    console.log('✅ Created billing plan: Enterprise');
  }

  // Create Workspace
  let workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-workspace' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Demo's Workspace",
        slug: 'demo-workspace',
        ownerId: user.id,
        billingPlanId: billingPlan.id,
        workspaceMembers: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
        apiKeys: {
          create: {
            key: 'sk_test_demo_key_123456789',
            name: 'Demo Key',
            role: 'admin',
          },
        },
      },
    });
    console.log(`✅ Created workspace: ${workspace.name}`);
  } else {
    console.log('Demo workspace already exists');
  }

  // Workflows
  const workflowCount = await prisma.workflow.count({ where: { userId: user.id } });
  
  if (workflowCount === 0) {
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
  }

  // Subscription
  const subscription = await prisma.subscription.findFirst({ where: { userId: user.id } });
  if (!subscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Created demo subscription');
  }

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
