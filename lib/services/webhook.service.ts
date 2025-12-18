import { prisma } from '@/lib/prisma';
import { generateWebhookSecret, createWebhookSignature } from '@/lib/encryption';
import axios from 'axios';
import type { Webhook, WebhookDelivery } from '@prisma/client';

export interface CreateWebhookInput {
  workspaceId: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  retryPolicy?: {
    maxAttempts?: number;
    backoffMs?: number;
  };
}

export interface UpdateWebhookInput {
  name?: string;
  description?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  retryPolicy?: Record<string, any>;
  enabled?: boolean;
}

export class WebhookService {
  async create(input: CreateWebhookInput): Promise<Webhook> {
    const secret = generateWebhookSecret();
    
    return prisma.webhook.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
        url: input.url,
        secret,
        events: input.events as any,
        headers: input.headers as any,
        retryPolicy: input.retryPolicy as any,
      },
    });
  }

  async findById(id: string): Promise<Webhook | null> {
    return prisma.webhook.findUnique({
      where: { id },
      include: {
        workspace: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<Webhook[]> {
    return prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateWebhookInput): Promise<Webhook> {
    return prisma.webhook.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.url && { url: input.url }),
        ...(input.events && { events: input.events as any }),
        ...(input.headers && { headers: input.headers as any }),
        ...(input.retryPolicy && { retryPolicy: input.retryPolicy as any }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.webhook.delete({
      where: { id },
    });
  }

  async regenerateSecret(id: string): Promise<Webhook> {
    const secret = generateWebhookSecret();
    
    return prisma.webhook.update({
      where: { id },
      data: { secret },
    });
  }

  async deliver(
    webhookId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<WebhookDelivery> {
    const webhook = await this.findById(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled) {
      throw new Error('Webhook is disabled');
    }

    if (!webhook.events.includes(eventType)) {
      throw new Error('Event type not subscribed');
    }

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType,
        payload: payload as any,
        status: 'pending',
      },
    });

    await this.attemptDelivery(delivery.id);

    return prisma.webhookDelivery.findUnique({
      where: { id: delivery.id },
    }) as Promise<WebhookDelivery>;
  }

  async attemptDelivery(deliveryId: string): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const { webhook } = delivery;
    const payloadString = JSON.stringify(delivery.payload);
    const signature = createWebhookSignature(payloadString, webhook.secret || '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery': delivery.id,
      ...(webhook.headers as Record<string, string>),
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(webhook.url, delivery.payload, {
        headers,
        timeout: 30000,
        validateStatus: () => true,
      });
      const duration = Date.now() - startTime;

      const success = response.status >= 200 && response.status < 300;

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: success ? 'success' : 'failed',
          attemptCount: delivery.attemptCount + 1,
          lastAttemptAt: new Date(),
          request: {
            url: webhook.url,
            headers,
            body: delivery.payload,
          } as any,
          response: {
            status: response.status,
            headers: response.headers,
            body: response.data,
            duration,
          } as any,
          error: success ? null : `HTTP ${response.status}: ${response.statusText}`,
        },
      });

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      });

      if (!success) {
        await this.scheduleRetry(deliveryId, delivery.attemptCount + 1, webhook.retryPolicy as any);
      }
    } catch (error: any) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          attemptCount: delivery.attemptCount + 1,
          lastAttemptAt: new Date(),
          error: error.message,
        },
      });

      await this.scheduleRetry(deliveryId, delivery.attemptCount + 1, webhook.retryPolicy as any);
    }
  }

  private async scheduleRetry(
    deliveryId: string,
    attemptCount: number,
    retryPolicy?: { maxAttempts?: number; backoffMs?: number }
  ): Promise<void> {
    const maxAttempts = retryPolicy?.maxAttempts || 3;
    const backoffMs = retryPolicy?.backoffMs || 1000;

    if (attemptCount >= maxAttempts) {
      return;
    }

    const delay = backoffMs * Math.pow(2, attemptCount - 1);
    const nextRetryAt = new Date(Date.now() + delay);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { nextRetryAt },
    });
  }

  async getDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async retryDelivery(deliveryId: string): Promise<void> {
    await this.attemptDelivery(deliveryId);
  }
}

export const webhookService = new WebhookService();
