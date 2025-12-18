import { BaseConnector } from './base-connector';
import { slackConnector } from './slack';
import { smtpConnector } from './smtp';
import { stripeConnector } from './stripe';
import { discordConnector } from './discord';
import { httpConnector } from './http';

export const connectorRegistry: Record<string, BaseConnector> = {
  slack: slackConnector,
  smtp: smtpConnector,
  stripe: stripeConnector,
  discord: discordConnector,
  http: httpConnector,
};

export function getConnector(type: string): BaseConnector | null {
  return connectorRegistry[type] || null;
}

export {
  BaseConnector,
  slackConnector,
  smtpConnector,
  stripeConnector,
  discordConnector,
  httpConnector,
};
