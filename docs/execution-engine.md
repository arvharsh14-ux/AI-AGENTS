# Execution Engine

The execution engine provides background job processing for workflows using Bull + Redis, with real-time status updates via Socket.io.

## Architecture

### Components

1. **Bull Queues** (`lib/workflow/queue.ts`)
   - `workflow-dispatch`: Handles workflow dispatch requests
   - `workflow-execution`: Processes actual workflow executions

2. **Workers** (`lib/workflow/workers.ts`)
   - Dispatch Worker: Creates execution records and enqueues execution jobs
   - Execution Worker: Executes workflow steps and updates execution status

3. **Executor** (`lib/workflow/executor.ts`)
   - Orchestrates step execution
   - Handles retries with exponential backoff
   - Logs execution progress and errors

4. **Socket.io Server** (`lib/workflow/socket.ts`)
   - Emits real-time execution events
   - Supports client subscriptions to specific executions

5. **API Endpoints**
   - `POST /api/workflows/[id]/execute`: Queue a workflow execution
   - `GET /api/executions`: List executions
   - `GET /api/executions/[id]`: Get execution details

## Setup

### 1. Start Redis

Redis is required for Bull queues. Using Docker Compose:

```bash
docker-compose up -d redis
```

Or install Redis locally and start it.

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_agents?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. Start the Application

The custom server integrates Socket.io with Next.js:

```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

### 4. Start the Workers

In a separate terminal, start the background workers:

```bash
pnpm workers
```

The workers will:
- Process queued workflow executions
- Handle retries automatically
- Register scheduled triggers (cron jobs)

## Usage

### Trigger a Workflow Execution

#### Via API

```bash
curl -X POST http://localhost:3000/api/workflows/{workflowId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "key": "value"
    }
  }'
```

#### Via UI

1. Navigate to a workflow detail page
2. Use the test panel to trigger an execution
3. View real-time execution status in the monitoring panel

### Monitor Executions

#### Real-time Monitoring UI

Visit `/monitoring` to see all executions with live status updates.

For workflow-specific executions, visit `/workflows/{workflowId}` and scroll to the "Recent Executions" section.

#### Via API

```bash
# List all executions
curl http://localhost:3000/api/executions

# Filter by workflow
curl http://localhost:3000/api/executions?workflowId={workflowId}

# Get execution details
curl http://localhost:3000/api/executions/{executionId}
```

## Execution Lifecycle

1. **Queued (pending)**
   - Workflow execution is added to the dispatch queue
   - An execution record is created with status "pending"

2. **Running**
   - Worker picks up the job from the execution queue
   - Executor processes each step sequentially
   - Status updates are emitted via Socket.io

3. **Completed (success)**
   - All steps completed successfully
   - Final output is saved to the execution record
   - Duration is calculated and stored

4. **Failed**
   - A step failed after all retry attempts
   - Error message is saved to the execution record
   - Execution stops immediately

## Error Handling & Retries

### Step-Level Retries

Each step can be retried based on workflow configuration:

- `retryMaxAttempts`: Maximum number of retry attempts (default: 3)
- `retryBackoffMs`: Initial backoff delay in milliseconds (default: 1000)
- Uses exponential backoff: delay = retryBackoffMs * 2^(attempt-1)

### Queue-Level Configuration

- Dispatch Queue: 3 attempts with exponential backoff (2s initial delay)
- Execution Queue: 1 attempt (retries handled at step level)

### Graceful Shutdown

Workers handle SIGTERM and SIGINT signals for graceful shutdown:

```bash
# Send shutdown signal
kill -SIGTERM <worker-pid>
```

## Socket.io Events

### Client → Server

- `subscribe`: Subscribe to execution updates
  ```javascript
  socket.emit('subscribe', executionId);
  ```

- `unsubscribe`: Unsubscribe from execution updates
  ```javascript
  socket.emit('unsubscribe', executionId);
  ```

### Server → Client

- `started`: Execution started
- `step_started`: Step execution started
- `step_completed`: Step completed successfully
- `step_failed`: Step failed
- `completed`: Execution completed successfully
- `failed`: Execution failed

All events include a `timestamp` field.

## Database Schema

### Execution

- `id`: Unique execution identifier
- `workflowVersionId`: Workflow version being executed
- `triggerId`: Trigger that initiated the execution (optional)
- `status`: pending | running | completed | failed | cancelled
- `input`: Input data (JSON)
- `output`: Output data (JSON)
- `error`: Error message (if failed)
- `startedAt`: Execution start time
- `completedAt`: Execution completion time
- `durationMs`: Execution duration in milliseconds
- `retryCount`: Number of retries performed

### ExecutionLog

- `id`: Unique log identifier
- `executionId`: Associated execution
- `level`: info | warn | error | debug
- `message`: Log message
- `metadata`: Additional context (JSON)
- `timestamp`: Log timestamp

### ExecutionStep

- `id`: Unique step execution identifier
- `executionId`: Associated execution
- `stepId`: Step definition
- `status`: pending | running | completed | failed | skipped
- `input`: Step input data (JSON)
- `output`: Step output data (JSON)
- `error`: Error message (if failed)
- `startedAt`: Step start time
- `completedAt`: Step completion time
- `durationMs`: Step duration in milliseconds
- `retryCount`: Number of retries performed

## Monitoring & Debugging

### View Execution Logs

Execution logs are stored in the database and can be viewed:

1. Via the monitoring UI (coming soon: detailed execution view)
2. Via API: `GET /api/executions/{executionId}`
3. Via database query:
   ```sql
   SELECT * FROM execution_logs WHERE execution_id = 'xxx' ORDER BY timestamp;
   ```

### Worker Logs

Workers output logs to stdout:

```bash
pnpm workers

[Workflow Engine] Starting workers...
[Dispatcher] Worker started
[Executor] Worker started with concurrency 5
[Workflow Engine] Registering schedule triggers...
[Workflow Engine] All systems ready
```

### Queue Monitoring

Use Bull Board or Redis CLI to monitor queue status:

```bash
# Redis CLI
redis-cli
> LLEN bull:workflow-dispatch:wait
> LLEN bull:workflow-execution:wait
```

## Production Deployment

### Recommendations

1. **Redis**: Use a managed Redis service (e.g., Redis Cloud, AWS ElastiCache)
2. **Workers**: Deploy workers as separate processes/containers
3. **Scaling**: Run multiple worker instances for higher throughput
4. **Monitoring**: Set up error tracking (e.g., Sentry) and metrics collection
5. **Rate Limiting**: Configure `rateLimitMaxConcurrent` and `rateLimitPerMinute` per workflow

### Environment Variables

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
REDIS_URL=<production-redis-url>
NEXTAUTH_URL=<production-app-url>
NEXTAUTH_SECRET=<secure-random-string>
```

### Docker Deployment

```dockerfile
# Web server (with Socket.io)
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "start"]

# Worker
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "workers"]
```

### Kubernetes Deployment

Deploy web server and workers as separate deployments:

```yaml
# web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: workflow-web
  template:
    metadata:
      labels:
        app: workflow-web
    spec:
      containers:
      - name: web
        image: your-registry/workflow-app:latest
        command: ["pnpm", "start"]
        ports:
        - containerPort: 3000

---
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-workers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workflow-workers
  template:
    metadata:
      labels:
        app: workflow-workers
    spec:
      containers:
      - name: worker
        image: your-registry/workflow-app:latest
        command: ["pnpm", "workers"]
```

## Troubleshooting

### Workers not processing jobs

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Verify worker is running:
   ```bash
   ps aux | grep "tsx lib/workflow/start-workers"
   ```

3. Check worker logs for errors

### Socket.io not connecting

1. Verify custom server is running (not standard Next.js)
2. Check Socket.io path is correct (`/api/socket`)
3. Check CORS configuration in `socket.ts`

### Executions stuck in "pending"

1. Ensure workers are running
2. Check Redis queue status
3. Verify workflow has an active version
4. Check execution logs for errors

## Performance Tuning

### Concurrency

Adjust worker concurrency based on your server capacity:

```typescript
// lib/workflow/workers.ts
startExecutionWorker(10); // Increase from default 5
```

### Queue Options

Customize job options in `queue.ts`:

```typescript
defaultJobOptions: {
  attempts: 5,           // More retry attempts
  backoff: {
    type: 'exponential',
    delay: 5000,         // Longer initial backoff
  },
  timeout: 300000,       // 5-minute timeout
}
```

### Database Connection Pooling

Ensure Prisma connection pool is properly configured:

```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add pool configuration
});
```
