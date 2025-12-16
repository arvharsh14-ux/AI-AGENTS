import { prisma } from '@/lib/prisma';
import { dispatchQueue } from '@/lib/workflow/queue';
import cronParser from 'cron-parser';

export class TriggerService {
  async createTrigger(data: {
    workflowId: string;
    type: string;
    config: Record<string, any>;
    enabled?: boolean;
  }) {
    const trigger = await prisma.trigger.create({
      data,
    });

    if (trigger.type === 'schedule' && trigger.enabled) {
      await this.registerScheduleTrigger(trigger.id);
    }

    return trigger;
  }

  async getTrigger(id: string) {
    return await prisma.trigger.findUnique({
      where: { id },
      include: {
        workflow: true,
      },
    });
  }

  async listTriggers(workflowId: string) {
    return await prisma.trigger.findMany({
      where: { workflowId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateTrigger(
    id: string,
    data: {
      type?: string;
      config?: Record<string, any>;
      enabled?: boolean;
    }
  ) {
    const trigger = await prisma.trigger.update({
      where: { id },
      data,
    });

    if (trigger.type === 'schedule') {
      if (trigger.enabled) {
        await this.registerScheduleTrigger(trigger.id);
      } else {
        await this.unregisterScheduleTrigger(trigger.id);
      }
    }

    return trigger;
  }

  async deleteTrigger(id: string) {
    const trigger = await prisma.trigger.findUnique({
      where: { id },
    });

    if (trigger?.type === 'schedule') {
      await this.unregisterScheduleTrigger(id);
    }

    return await prisma.trigger.delete({
      where: { id },
    });
  }

  async registerScheduleTrigger(triggerId: string) {
    const trigger = await this.getTrigger(triggerId);
    
    if (!trigger || trigger.type !== 'schedule') {
      throw new Error('Invalid schedule trigger');
    }

    const config = trigger.config as { cron: string };
    
    try {
      cronParser.parseExpression(config.cron);
    } catch (error) {
      throw new Error('Invalid cron expression');
    }

    await dispatchQueue.add(
      {
        workflowId: trigger.workflowId,
        triggerId: trigger.id,
      },
      {
        repeat: {
          cron: config.cron,
        },
        jobId: `schedule-${triggerId}`,
      }
    );
  }

  async unregisterScheduleTrigger(triggerId: string) {
    const jobId = `schedule-${triggerId}`;
    const repeatableJobs = await dispatchQueue.getRepeatableJobs();
    
    const job = repeatableJobs.find((j) => j.id === jobId);
    if (job) {
      await dispatchQueue.removeRepeatableByKey(job.key);
    }
  }

  async registerAllScheduleTriggers() {
    const triggers = await prisma.trigger.findMany({
      where: {
        type: 'schedule',
        enabled: true,
      },
    });

    for (const trigger of triggers) {
      try {
        await this.registerScheduleTrigger(trigger.id);
      } catch (error) {
        console.error(`Failed to register schedule trigger ${trigger.id}:`, error);
      }
    }
  }
}

export const triggerService = new TriggerService();
