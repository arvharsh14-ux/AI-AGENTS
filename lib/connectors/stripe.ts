import Stripe from 'stripe';
import { BaseConnector, ConnectorAction, ConnectorConfig } from './base-connector';
import { interpolateVariables } from '@/lib/workflow/interpolation';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class StripeConnector extends BaseConnector {
  readonly type = 'stripe';
  readonly name = 'Stripe';
  readonly description = 'Interact with Stripe payment platform';
  
  readonly actions: ConnectorAction[] = [
    {
      name: 'create_customer',
      description: 'Create a new Stripe customer',
      inputSchema: {
        email: { type: 'string', required: true },
        name: { type: 'string', required: false },
        description: { type: 'string', required: false },
        metadata: { type: 'object', required: false },
      },
      outputSchema: {
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
    {
      name: 'create_invoice',
      description: 'Create a Stripe invoice',
      inputSchema: {
        customer: { type: 'string', required: true, description: 'Customer ID' },
        description: { type: 'string', required: false },
        metadata: { type: 'object', required: false },
        auto_advance: { type: 'boolean', required: false },
      },
      outputSchema: {
        id: { type: 'string' },
        status: { type: 'string' },
      },
    },
    {
      name: 'create_invoice_item',
      description: 'Add an item to a Stripe invoice',
      inputSchema: {
        customer: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        description: { type: 'string', required: false },
        invoice: { type: 'string', required: false },
      },
      outputSchema: {
        id: { type: 'string' },
        amount: { type: 'number' },
      },
    },
    {
      name: 'create_payment_intent',
      description: 'Create a Stripe payment intent',
      inputSchema: {
        amount: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        customer: { type: 'string', required: false },
        description: { type: 'string', required: false },
        metadata: { type: 'object', required: false },
      },
      outputSchema: {
        id: { type: 'string' },
        client_secret: { type: 'string' },
        status: { type: 'string' },
      },
    },
    {
      name: 'retrieve_customer',
      description: 'Retrieve a Stripe customer',
      inputSchema: {
        customer_id: { type: 'string', required: true },
      },
      outputSchema: {
        id: { type: 'string' },
        email: { type: 'string' },
      },
    },
  ];

  async execute(
    action: string,
    config: ConnectorConfig,
    context: ExecutionContext
  ): Promise<StepResult> {
    try {
      if (!config.credentialId) {
        return this.createErrorResult('Stripe credential not configured');
      }

      const credentials = await this.getCredentials(config.credentialId, context.userId || '');
      const apiKey = credentials.secret_key || credentials.api_key;

      if (!apiKey) {
        return this.createErrorResult('Stripe API key not found in credentials');
      }

      const stripe = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
      });

      const interpolatedConfig = interpolateVariables(config, {
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      }) as ConnectorConfig;

      switch (action) {
        case 'create_customer':
          return await this.createCustomer(stripe, interpolatedConfig);
        case 'create_invoice':
          return await this.createInvoice(stripe, interpolatedConfig);
        case 'create_invoice_item':
          return await this.createInvoiceItem(stripe, interpolatedConfig);
        case 'create_payment_intent':
          return await this.createPaymentIntent(stripe, interpolatedConfig);
        case 'retrieve_customer':
          return await this.retrieveCustomer(stripe, interpolatedConfig);
        default:
          return this.createErrorResult(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Stripe connector failed');
    }
  }

  private async createCustomer(stripe: Stripe, config: ConnectorConfig): Promise<StepResult> {
    const customer = await stripe.customers.create({
      email: config.email,
      name: config.name,
      description: config.description,
      metadata: config.metadata,
    });

    return this.createSuccessResult(customer);
  }

  private async createInvoice(stripe: Stripe, config: ConnectorConfig): Promise<StepResult> {
    const invoice = await stripe.invoices.create({
      customer: config.customer,
      description: config.description,
      metadata: config.metadata,
      auto_advance: config.auto_advance,
    });

    return this.createSuccessResult(invoice);
  }

  private async createInvoiceItem(stripe: Stripe, config: ConnectorConfig): Promise<StepResult> {
    const invoiceItem = await stripe.invoiceItems.create({
      customer: config.customer,
      amount: config.amount,
      currency: config.currency,
      description: config.description,
      invoice: config.invoice,
    });

    return this.createSuccessResult(invoiceItem);
  }

  private async createPaymentIntent(stripe: Stripe, config: ConnectorConfig): Promise<StepResult> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: config.amount,
      currency: config.currency,
      customer: config.customer,
      description: config.description,
      metadata: config.metadata,
    });

    return this.createSuccessResult(paymentIntent);
  }

  private async retrieveCustomer(stripe: Stripe, config: ConnectorConfig): Promise<StepResult> {
    const customer = await stripe.customers.retrieve(config.customer_id);

    return this.createSuccessResult(customer);
  }
}

export const stripeConnector = new StripeConnector();
