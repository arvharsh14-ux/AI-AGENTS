# Workflow Engine Documentation

## Overview

The workflow engine is a modular, scalable automation system that supports creating, versioning, triggering, and executing workflows through a Bull queue-based architecture.

## Architecture

### Components

1. **Data Layer (Prisma Models)**
   - `Workflow`: Base workflow configuration with rate limiting and retry policies
   - `WorkflowVersion`: Versioned workflow definitions
   - `Step`: Individual workflow steps
   - `Trigger`: Workflow triggers (manual, webhook, schedule, event, API)
   - `ConnectorInstance`: External service connections
   - `Execution`: Workflow run records
   - `ExecutionStep`: Individual step execution records
   - `ExecutionLog`: Detailed execution logs

2. **Queue System (Bull)**
   - **Dispatch Queue**: Receives workflow execution requests and creates execution records
   - **Execution Queue**: Processes workflow executions step-by-step with configurable concurrency

3. **Step Runners**
   - `HttpRequestRunner`: Makes HTTP requests with full axios support
   - `TransformRunner`: Executes JavaScript transformations in a sandboxed VM
   - `ConditionalRunner`: Evaluates conditions for branching logic
   - `LoopRunner`: Iterates over arrays with optional parallel execution
   - `DelayRunner`: Adds delays between steps
   - `CustomCodeRunner`: Executes custom JavaScript or Python code in a sandbox

4. **Real-time Events (Socket.io)**
   - Live execution status updates
   - Step-by-step progress tracking
   - Error notifications

## Getting Started

### Prerequisites

- PostgreSQL database
- Redis server (for Bull queues)
- Node.js 18+
- Optional: Python 3 (for custom Python code steps)

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Running the System

1. **Start the Next.js Application**
   ```bash
   pnpm dev
   ```

2. **Start the Queue Workers**
   ```bash
   pnpm workers
   ```

## Creating Workflows

### 1. Create a Workflow

```bash
POST /api/workflows
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Process user data",
  "rateLimitMaxConcurrent": 5,
  "rateLimitPerMinute": 100,
  "retryMaxAttempts": 3,
  "retryBackoffMs": 1000
}
```

### 2. Create a Version

```bash
POST /api/workflows/{workflowId}/versions
Content-Type: application/json

{
  "definition": {
    "steps": [
      {
        "id": "step1",
        "name": "fetchData",
        "type": "http_request",
        "position": 0,
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET",
          "headers": {
            "Authorization": "Bearer {{variables.apiToken}}"
          }
        }
      },
      {
        "id": "step2",
        "name": "transformData",
        "type": "transform",
        "position": 1,
        "config": {
          "code": "return { processed: input.fetchData.data.map(item => item.id) };"
        }
      }
    ]
  }
}
```

### 3. Publish a Version

```bash
POST /api/workflows/{workflowId}/versions/{versionId}/publish
```

## Trigger Types

### Manual Trigger

Execute via API:

```bash
POST /api/workflows/{workflowId}/execute
Content-Type: application/json

{
  "input": {
    "userId": "123",
    "apiToken": "secret"
  }
}
```

### Webhook Trigger

1. Create webhook trigger:
```bash
POST /api/workflows/{workflowId}/triggers
Content-Type: application/json

{
  "type": "webhook",
  "config": {},
  "enabled": true
}
```

2. Use webhook URL:
```bash
POST /api/webhooks/{triggerId}
Content-Type: application/json

{
  "data": "your webhook payload"
}
```

### Schedule Trigger

Create a cron-based schedule:

```bash
POST /api/workflows/{workflowId}/triggers
Content-Type: application/json

{
  "type": "schedule",
  "config": {
    "cron": "0 */6 * * *"
  },
  "enabled": true
}
```

Cron format: `minute hour day month dayOfWeek`
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - 9 AM on weekdays
- `*/15 * * * *` - Every 15 minutes

## Step Types

### HTTP Request

```json
{
  "type": "http_request",
  "config": {
    "url": "https://api.example.com/endpoint",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{variables.token}}"
    },
    "body": {
      "data": "{{input.data}}"
    },
    "timeout": 30000
  }
}
```

### Transform (JavaScript)

```json
{
  "type": "transform",
  "config": {
    "code": "return { result: input.value * 2 };",
    "inputMapping": {
      "value": "{{variables.previousStep.output}}"
    }
  }
}
```

### Conditional

```json
{
  "type": "conditional",
  "config": {
    "condition": "variables.status === 'active'",
    "trueSteps": ["step3", "step4"],
    "falseSteps": ["step5"]
  }
}
```

### Loop

```json
{
  "type": "loop",
  "config": {
    "items": "{{variables.users}}",
    "stepId": "processUser",
    "maxIterations": 100,
    "parallel": false
  }
}
```

### Delay

```json
{
  "type": "delay",
  "config": {
    "milliseconds": 5000
  }
}
```

### Custom Code (JavaScript)

```json
{
  "type": "custom_code",
  "config": {
    "language": "javascript",
    "code": "return { result: variables.data.filter(x => x.active) };",
    "timeout": 10000
  }
}
```

### Custom Code (Python)

```json
{
  "type": "custom_code",
  "config": {
    "language": "python",
    "code": "result = [x * 2 for x in variables['numbers']]",
    "timeout": 10000
  }
}
```

## Variable Interpolation

Use `{{path.to.variable}}` syntax to access:

- `{{input.fieldName}}` - Workflow input
- `{{variables.stepName.output}}` - Previous step outputs
- `{{metadata.key}}` - Execution metadata

Supports:
- Nested objects: `{{user.profile.email}}`
- Array indexing: `{{items[0].name}}`
- Deep paths: `{{data.items[0].user.name}}`

## Real-time Events

Connect to Socket.io for live updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/api/socket',
});

socket.emit('subscribe', executionId);

socket.on('started', (data) => {
  console.log('Execution started:', data);
});

socket.on('step_started', (data) => {
  console.log('Step started:', data);
});

socket.on('step_completed', (data) => {
  console.log('Step completed:', data);
});

socket.on('step_failed', (data) => {
  console.log('Step failed:', data);
});

socket.on('completed', (data) => {
  console.log('Execution completed:', data);
});

socket.on('failed', (data) => {
  console.log('Execution failed:', data);
});
```

## Error Handling & Retries

### Workflow-level Retries

Configured per workflow:
- `retryMaxAttempts`: Maximum retry attempts (default: 3)
- `retryBackoffMs`: Initial backoff delay (default: 1000ms)
- Exponential backoff: delay doubles with each retry

### Step-level Error Handlers

```json
{
  "id": "step1",
  "name": "riskyOperation",
  "type": "http_request",
  "errorHandler": "errorHandlerStep",
  "config": { ... }
}
```

### Fallback Steps

```json
{
  "type": "fallback",
  "config": {
    "code": "return { error: true, message: 'Operation failed' };"
  }
}
```

## Rate Limiting

Per-workflow concurrency controls:
- `rateLimitMaxConcurrent`: Max concurrent executions (default: 5)
- `rateLimitPerMinute`: Max executions per minute (default: 100)

Implemented at the queue level with Bull's built-in rate limiting.

## Monitoring & Debugging

### View Execution Details

```bash
GET /api/executions/{executionId}
```

Returns:
- Execution status, input, output
- All step executions with timings
- Complete logs with timestamps
- Error details

### Execution Logs

Logs capture:
- Level: info, warn, error, debug
- Message: Human-readable description
- Metadata: Additional context data
- Timestamp: Precise timing

## Extension Points

### Adding Custom Step Types

1. Create a new step runner in `lib/workflow/step-runners/`:

```typescript
import { BaseStepRunner } from './base';
import type { ExecutionContext, StepResult } from '@/lib/types/workflow.types';

export class MyCustomRunner extends BaseStepRunner {
  async run(config: any, context: ExecutionContext): Promise<StepResult> {
    try {
      // Your custom logic here
      const result = await someOperation(config, context);
      
      return this.createSuccessResult(result);
    } catch (error: any) {
      return this.createErrorResult(error.message);
    }
  }
}
```

2. Register in `lib/workflow/executor.ts`:

```typescript
import { MyCustomRunner } from './step-runners/my-custom';

const stepRunners: Record<StepType, BaseStepRunner> = {
  // ... existing runners
  my_custom: new MyCustomRunner(),
};
```

3. Add type to `lib/types/workflow.types.ts`:

```typescript
export type StepType =
  | 'http_request'
  | 'transform'
  // ... existing types
  | 'my_custom';
```

### Adding Custom Triggers

Extend `triggerService` to handle new trigger types in `lib/services/trigger.service.ts`.

## Security Considerations

### Sandbox Execution

JavaScript and Python code execute in sandboxes with:
- Timeout limits (default: 10 seconds)
- No file system access
- No network access (except via HTTP step type)
- No process spawning

### Authentication

All API endpoints require:
- Valid session (NextAuth.js)
- Workflow ownership verification
- Public workflow access for non-owners

### Input Validation

Always validate:
- Cron expressions for schedule triggers
- URLs for HTTP requests
- JavaScript/Python code syntax
- Step configurations

## Testing

Run tests:
```bash
pnpm test
```

Test categories:
- Unit tests: Step runners, interpolation, utilities
- Integration tests: Queue dispatch, trigger evaluation
- Security tests: Sandbox safety, timeout enforcement

## Performance Optimization

### Queue Concurrency

Adjust worker concurrency in `lib/workflow/workers.ts`:

```typescript
startExecutionWorker(10); // Process 10 workflows concurrently
```

### Database Indexing

Key indexes already configured:
- `workflowVersionId` on executions
- `triggerId` on executions
- `status` on executions
- `executionId` on logs and steps

### Caching

Consider caching:
- Active workflow versions
- Connector configurations
- User permissions

## Troubleshooting

### Workers Not Processing

1. Check Redis connection
2. Verify workers are running (`pnpm workers`)
3. Check worker logs for errors

### Schedule Triggers Not Firing

1. Verify cron expression is valid
2. Check trigger is enabled
3. Ensure workers registered triggers on startup

### Execution Timeouts

1. Increase step timeout in config
2. Check for infinite loops
3. Review retry policy settings

### Real-time Events Not Received

1. Verify Socket.io connection
2. Check CORS settings
3. Ensure client subscribed to correct execution ID

## API Reference

See full API documentation in [API.md](./API.md) (to be created).

## Contributing

When extending the workflow engine:
1. Follow existing patterns and conventions
2. Add comprehensive tests
3. Update documentation
4. Consider security implications
5. Test with various workflow configurations
