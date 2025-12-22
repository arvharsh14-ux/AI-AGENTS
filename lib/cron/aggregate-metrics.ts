import 'dotenv/config';
import { aggregateExecutionMetrics } from '../services/metrics.service';
import { prisma } from '../prisma';
import { trackUsage } from '../services/usage.service';

async function runAggregation() {
  console.log('Starting metrics aggregation...');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    // Aggregate daily metrics for yesterday
    await aggregateExecutionMetrics(yesterday);
    console.log(`✅ Aggregated metrics for ${yesterday.toISOString().split('T')[0]}`);

    // Aggregate hourly metrics for today
    const currentHour = now.getHours();
    for (let hour = 0; hour < currentHour; hour++) {
      await aggregateExecutionMetrics(now, hour);
    }
    console.log(`✅ Aggregated hourly metrics for today up to hour ${currentHour}`);

    // Track usage for all workspaces
    const workspaces = await prisma.workspace.findMany();
    for (const workspace of workspaces) {
      await trackUsage(workspace.id);
    }
    console.log(`✅ Tracked usage for ${workspaces.length} workspaces`);

  } catch (error) {
    console.error('Error during aggregation:', error);
  }
}

if (require.main === module) {
  runAggregation()
    .then(() => {
      console.log('Aggregation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAggregation };
