# Monitoring, Billing, RBAC, and Observability

This document describes the comprehensive monitoring, billing, team management, and observability features implemented in the AI-AGENTS platform.

## Features Overview

### 1. Monitoring & Observability

#### Execution Metrics
- Real-time metrics dashboard showing:
  - Total executions
  - Success/failure counts
  - Average duration
  - Running executions
- Historical metrics with daily and hourly aggregation
- Percentile tracking (P50, P95, P99) for latency analysis

#### Execution Logs
- Detailed execution history with filtering by:
  - Status (completed, failed, running, pending)
  - Workflow
  - Date range
- Step-level execution details
- Log viewer with severity levels
- Export capabilities (CSV/JSON)

#### Audit Logs
- Comprehensive activity tracking for:
  - Workspace changes
  - Member invitations and role updates
  - API key creation/deletion
  - Workflow operations
- Filterable by action type, entity, user, and date
- Export support (CSV/JSON)

### 2. Team & RBAC Management

#### Roles
- **Owner**: Full access to all features including billing
- **Admin**: Can manage team members, workflows, and settings (no billing access)
- **Editor**: Can create, edit, and execute workflows
- **Viewer**: Read-only access to workflows and executions

#### Permission System
Granular permissions for:
- `workspace:read` / `workspace:write`
- `workflow:create` / `workflow:read` / `workflow:update` / `workflow:delete` / `workflow:execute`
- `member:invite` / `member:remove` / `member:read`
- `apikey:create` / `apikey:read` / `apikey:delete`
- `billing:read` / `billing:write`
- `alerts:read` / `alerts:write`

#### Team Management
- Invite members via email with role assignment
- 7-day expiring invitation tokens
- Accept/reject invitations
- Update member roles
- Remove members (with owner protection)
- Activity feed showing team actions

### 3. API Key Management

#### Features
- Create API keys with role-based permissions
- Optional expiration dates
- Usage tracking (request count)
- Last used timestamp
- Secure key generation (sk_* prefix)
- Keys are only shown once at creation

#### Role Scoping
API keys inherit the same role-based permission system as users, allowing for:
- Admin API keys for full automation
- Editor API keys for workflow creation
- Viewer API keys for read-only access

### 4. Alerting System

#### Alert Rules
Three types of alert rules:
- **Execution Failure**: Triggered when failures exceed threshold
- **Rate Limit Breach**: Triggered when execution rate exceeds limit
- **Quota Warning**: Triggered when usage approaches plan limits

#### Alert Conditions
- Configurable thresholds
- Time windows (e.g., 60 minutes)
- Enable/disable alerts
- Multiple rules per workspace

#### Notification Channels
- **Email**: Send to multiple recipients
- **Slack**: Webhook integration

#### Alert Notifications
- Tracks delivery status (pending, sent, failed)
- Error logging for failed deliveries
- Historical notification records

### 5. Stripe Billing Integration

#### Billing Plans
Three tiers with different limits:
- **Free**: 1,000 executions/month, 100 run minutes, 10 workflows, 5 connectors, 1 team member
- **Pro**: 50,000 executions/month, 5,000 run minutes, 100 workflows, 50 connectors, 10 team members - $49/month
- **Enterprise**: 500,000 executions/month, 50,000 run minutes, 1,000 workflows, 500 connectors, 100 team members - $199/month

#### Features
- Stripe Checkout for upgrades
- Customer Portal for subscription management
- Automatic subscription syncing via webhooks
- Plan-based quota enforcement
- Graceful downgrade to free plan on cancellation

#### Usage Tracking
Tracks daily usage for:
- Execution count
- Run minutes (total execution time)
- Workflow count
- Connector count
- Team member count

#### Quota Enforcement
- Pre-execution quota checks
- Execution blocked when limits reached
- Clear error messages
- Real-time usage display in billing dashboard

### 6. Usage Dashboard

Real-time usage bars showing:
- Current usage vs. limit
- Percentage-based color coding:
  - Blue: < 75%
  - Yellow: 75-90%
  - Red: > 90%
- Visual progress bars
- Support for unlimited plans (∞)

## API Endpoints

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id/members` - List members
- `POST /api/workspaces/:id/members` - Invite member
- `PATCH /api/workspaces/:id/members` - Update member role
- `DELETE /api/workspaces/:id/members` - Remove member

### API Keys
- `GET /api/workspaces/:id/apikeys` - List API keys
- `POST /api/workspaces/:id/apikeys` - Create API key
- `DELETE /api/workspaces/:id/apikeys` - Delete API key

### Invites
- `POST /api/invites/accept` - Accept invitation

### Billing
- `GET /api/billing/plans` - List billing plans
- `POST /api/workspaces/:id/billing/checkout` - Create checkout session
- `POST /api/workspaces/:id/billing/portal` - Open billing portal
- `GET /api/workspaces/:id/usage` - Get current usage

### Metrics
- `GET /api/metrics?realtime=true` - Get real-time metrics
- `GET /api/metrics?startDate=...&endDate=...` - Get historical metrics

### Executions
- `GET /api/executions` - List executions with filters
- `GET /api/executions?format=csv` - Export executions as CSV
- `GET /api/executions?format=json` - Export executions as JSON

### Audit Logs
- `GET /api/workspaces/:id/audit-logs` - List audit logs
- `GET /api/workspaces/:id/audit-logs?format=csv` - Export as CSV
- `GET /api/workspaces/:id/audit-logs?format=json` - Export as JSON

### Alerts
- `GET /api/workspaces/:id/alerts/rules` - List alert rules
- `POST /api/workspaces/:id/alerts/rules` - Create alert rule
- `PATCH /api/workspaces/:id/alerts/rules` - Update alert rule
- `DELETE /api/workspaces/:id/alerts/rules` - Delete alert rule
- `GET /api/workspaces/:id/alerts/channels` - List alert channels
- `POST /api/workspaces/:id/alerts/channels` - Create alert channel
- `DELETE /api/workspaces/:id/alerts/channels` - Delete alert channel

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Services

### Stripe Service (`lib/services/stripe.service.ts`)
- Customer creation and management
- Checkout session creation
- Billing portal session creation
- Subscription webhook handlers

### Metrics Service (`lib/services/metrics.service.ts`)
- Execution metrics aggregation
- Percentile calculations
- Real-time metrics
- Historical metrics retrieval

### RBAC Service (`lib/services/rbac.service.ts`)
- Permission checks
- Role validation
- Member invitations
- Invite acceptance
- Member removal with protection

### Alert Service (`lib/services/alert.service.ts`)
- Alert rule evaluation
- Condition checking
- Multi-channel notification delivery
- Notification tracking

### Usage Service (`lib/services/usage.service.ts`)
- Daily usage tracking
- Quota enforcement
- Current usage calculation
- Plan limit validation

### Audit Service (`lib/services/audit.service.ts`)
- Event logging
- Log retrieval with filtering
- Export functionality (CSV/JSON)

## Background Jobs

### Metrics Aggregation
Run: `pnpm cron:metrics`

This job should be scheduled to run hourly (e.g., via cron):
```bash
0 * * * * cd /path/to/project && pnpm cron:metrics
```

The job performs:
- Daily metrics aggregation for previous day
- Hourly metrics aggregation for current day
- Usage tracking for all workspaces
- Alert rule evaluation

## Database Schema

### New Tables
- `workspace_invites` - Team member invitations
- `execution_metrics` - Aggregated execution metrics
- `audit_logs` - Activity audit trail
- `alert_rules` - Alert rule definitions
- `alert_channels` - Notification channel configurations
- `alert_notifications` - Notification delivery records
- `usage_records` - Daily usage tracking

### Updated Tables
- `workspaces` - Added Stripe customer/subscription IDs
- `billing_plans` - Added detailed limit fields
- `api_keys` - Added role and usage tracking
- `memberships` - Updated role options

## UI Pages

### `/billing` - Billing & Usage
- Current plan display
- Usage bars for all metrics
- Plan comparison cards
- Upgrade buttons with Stripe Checkout
- Billing portal access

### `/monitoring` - Execution Monitoring
- Real-time metrics cards
- Execution list with filtering
- Export buttons (CSV/JSON)
- Execution details modal with:
  - Step-level information
  - Log viewer
  - Retry information

### `/team` - Team Management
- Member list with roles
- Invite modal
- Role updates
- Member removal
- Activity feed

### `/api-keys` - API Key Management
- API key list with usage stats
- Create API key modal
- Key display (one-time only)
- Delete functionality

### `/alerts` - Alert Configuration
- Alert rules management
- Notification channels
- Enable/disable toggles
- Rule creation modals

## Configuration

### Environment Variables
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Setup
1. Create products and prices in Stripe Dashboard
2. Update `stripePriceId` in billing plans
3. Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Add webhook secret to environment variables

## Security Considerations

1. **API Keys**: Stored securely, only shown once at creation
2. **Permissions**: Enforced at API level for all operations
3. **Invitations**: Time-limited tokens with expiration
4. **Webhooks**: Signature verification for Stripe webhooks
5. **Quota Enforcement**: Pre-execution checks prevent abuse
6. **Audit Logs**: Comprehensive tracking of all actions

## Testing

Run the test suite:
```bash
pnpm test
```

## Deployment Checklist

- [ ] Set up Stripe account and configure products
- [ ] Add Stripe environment variables
- [ ] Configure Stripe webhook endpoint
- [ ] Run database migration
- [ ] Seed billing plans
- [ ] Set up cron job for metrics aggregation
- [ ] Configure email service for alerts
- [ ] Test Stripe Checkout flow
- [ ] Test quota enforcement
- [ ] Verify alert delivery
