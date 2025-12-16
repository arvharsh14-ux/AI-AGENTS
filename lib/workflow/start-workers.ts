import { startWorkers } from './workers';
import { triggerService } from '@/lib/services/trigger.service';

async function main() {
  console.log('[Workflow Engine] Starting workers...');

  startWorkers();

  console.log('[Workflow Engine] Registering schedule triggers...');
  await triggerService.registerAllScheduleTriggers();

  console.log('[Workflow Engine] All systems ready');
}

main().catch((error) => {
  console.error('[Workflow Engine] Failed to start:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('[Workflow Engine] Shutting down gracefully...');
  process.exit(0);
});
