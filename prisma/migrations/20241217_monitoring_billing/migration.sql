-- AlterTable: Add Stripe fields to Workspace
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

-- AlterTable: Update Membership roles
ALTER TABLE "memberships" ALTER COLUMN "role" SET DEFAULT 'viewer';

-- AlterTable: Update BillingPlan
ALTER TABLE "billing_plans" ADD COLUMN IF NOT EXISTS "maxExecutionsPerMonth" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "billing_plans" ADD COLUMN IF NOT EXISTS "maxConnectors" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "billing_plans" ADD COLUMN IF NOT EXISTS "maxRunMinutesPerMonth" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "billing_plans" ADD COLUMN IF NOT EXISTS "maxWorkflows" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "billing_plans" ADD COLUMN IF NOT EXISTS "maxTeamMembers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "billing_plans" DROP COLUMN IF EXISTS "features";

-- AlterTable: Add role and usageCount to APIKey
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'viewer';
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: WorkspaceInvite
CREATE TABLE IF NOT EXISTS "workspace_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "token" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workspace_invites_workspaceId_idx" ON "workspace_invites"("workspaceId");
CREATE INDEX IF NOT EXISTS "workspace_invites_email_idx" ON "workspace_invites"("email");

-- CreateTable: ExecutionMetrics
CREATE TABLE IF NOT EXISTS "execution_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT,
    "userId" TEXT,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successfulExecutions" INTEGER NOT NULL DEFAULT 0,
    "failedExecutions" INTEGER NOT NULL DEFAULT 0,
    "totalDurationMs" BIGINT NOT NULL DEFAULT 0,
    "minDurationMs" INTEGER,
    "maxDurationMs" INTEGER,
    "avgDurationMs" DOUBLE PRECISION,
    "p50DurationMs" INTEGER,
    "p95DurationMs" INTEGER,
    "p99DurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    UNIQUE("workspaceId", "userId", "date", "hour")
);

CREATE INDEX IF NOT EXISTS "execution_metrics_workspaceId_date_idx" ON "execution_metrics"("workspaceId", "date");
CREATE INDEX IF NOT EXISTS "execution_metrics_userId_date_idx" ON "execution_metrics"("userId", "date");

-- CreateTable: AuditLog
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "audit_logs_workspaceId_timestamp_idx" ON "audit_logs"("workspaceId", "timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateTable: AlertRule
CREATE TABLE IF NOT EXISTS "alert_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alert_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "alert_rules_workspaceId_idx" ON "alert_rules"("workspaceId");

-- CreateTable: AlertChannel
CREATE TABLE IF NOT EXISTS "alert_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alert_channels_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "alert_channels_workspaceId_idx" ON "alert_channels"("workspaceId");

-- CreateTable: AlertNotification
CREATE TABLE IF NOT EXISTS "alert_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertRuleId" TEXT NOT NULL,
    "alertChannelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_notifications_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "alert_rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alert_notifications_alertChannelId_fkey" FOREIGN KEY ("alertChannelId") REFERENCES "alert_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "alert_notifications_alertRuleId_idx" ON "alert_notifications"("alertRuleId");
CREATE INDEX IF NOT EXISTS "alert_notifications_alertChannelId_idx" ON "alert_notifications"("alertChannelId");
CREATE INDEX IF NOT EXISTS "alert_notifications_status_idx" ON "alert_notifications"("status");

-- CreateTable: UsageRecord
CREATE TABLE IF NOT EXISTS "usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "runMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "connectorCount" INTEGER NOT NULL DEFAULT 0,
    "workflowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_records_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("workspaceId", "date")
);

CREATE INDEX IF NOT EXISTS "usage_records_workspaceId_date_idx" ON "usage_records"("workspaceId", "date");

-- Add unique constraints for Stripe fields
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_stripeCustomerId_key" ON "workspaces"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_stripeSubscriptionId_key" ON "workspaces"("stripeSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "billing_plans_stripePriceId_key" ON "billing_plans"("stripePriceId");
