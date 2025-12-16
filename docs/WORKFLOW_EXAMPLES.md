# Workflow Engine Examples

## Example 1: Simple Data Fetch and Transform

This workflow fetches data from an API and transforms it.

```json
{
  "name": "Fetch and Transform Users",
  "description": "Fetches users from API and extracts email addresses",
  "definition": {
    "steps": [
      {
        "id": "fetch_users",
        "name": "fetchUsers",
        "type": "http_request",
        "position": 0,
        "config": {
          "url": "https://jsonplaceholder.typicode.com/users",
          "method": "GET",
          "headers": {
            "Content-Type": "application/json"
          }
        }
      },
      {
        "id": "extract_emails",
        "name": "extractEmails",
        "type": "transform",
        "position": 1,
        "config": {
          "code": "return { emails: input.fetchUsers.data.map(user => user.email) };"
        }
      }
    ]
  }
}
```

## Example 2: Conditional Workflow

This workflow checks a condition and executes different steps based on the result.

```json
{
  "name": "Order Processing",
  "description": "Process orders based on amount",
  "definition": {
    "steps": [
      {
        "id": "check_amount",
        "name": "checkAmount",
        "type": "conditional",
        "position": 0,
        "config": {
          "condition": "input.amount > 1000",
          "trueSteps": ["send_approval"],
          "falseSteps": ["auto_approve"]
        }
      },
      {
        "id": "send_approval",
        "name": "sendApproval",
        "type": "http_request",
        "position": 1,
        "config": {
          "url": "https://api.example.com/approvals",
          "method": "POST",
          "body": {
            "orderId": "{{input.orderId}}",
            "amount": "{{input.amount}}"
          }
        }
      },
      {
        "id": "auto_approve",
        "name": "autoApprove",
        "type": "transform",
        "position": 2,
        "config": {
          "code": "return { approved: true, automatic: true };"
        }
      }
    ]
  }
}
```

## Example 3: Loop Processing

This workflow processes multiple items in a loop.

```json
{
  "name": "Batch Email Sender",
  "description": "Sends emails to multiple recipients",
  "definition": {
    "steps": [
      {
        "id": "prepare_recipients",
        "name": "prepareRecipients",
        "type": "transform",
        "position": 0,
        "config": {
          "code": "return { recipients: input.emails.map(email => ({ email, subject: input.subject })) };"
        }
      },
      {
        "id": "loop_send",
        "name": "loopSend",
        "type": "loop",
        "position": 1,
        "config": {
          "items": "{{variables.prepareRecipients.recipients}}",
          "stepId": "send_email",
          "maxIterations": 100,
          "parallel": false
        }
      },
      {
        "id": "send_email",
        "name": "sendEmail",
        "type": "http_request",
        "position": 2,
        "config": {
          "url": "https://api.example.com/send-email",
          "method": "POST",
          "body": "{{variables.currentItem}}"
        }
      }
    ]
  }
}
```

## Example 4: Error Handling with Delay and Retry

This workflow includes delays and demonstrates error handling.

```json
{
  "name": "Resilient API Call",
  "description": "Makes API calls with delays and retries",
  "definition": {
    "steps": [
      {
        "id": "delay_start",
        "name": "delayStart",
        "type": "delay",
        "position": 0,
        "config": {
          "milliseconds": 2000
        }
      },
      {
        "id": "api_call",
        "name": "apiCall",
        "type": "http_request",
        "position": 1,
        "errorHandler": "handle_error",
        "config": {
          "url": "{{input.apiUrl}}",
          "method": "GET",
          "timeout": 10000
        }
      },
      {
        "id": "handle_error",
        "name": "handleError",
        "type": "fallback",
        "position": 2,
        "config": {
          "code": "return { error: true, message: 'API call failed, using fallback' };"
        }
      }
    ]
  }
}
```

## Example 5: Complex Data Pipeline

This workflow demonstrates a complete data processing pipeline.

```json
{
  "name": "Customer Data Pipeline",
  "description": "Fetches, validates, transforms, and stores customer data",
  "definition": {
    "steps": [
      {
        "id": "fetch_customers",
        "name": "fetchCustomers",
        "type": "http_request",
        "position": 0,
        "config": {
          "url": "{{input.sourceUrl}}",
          "method": "GET",
          "headers": {
            "Authorization": "Bearer {{input.apiToken}}"
          }
        }
      },
      {
        "id": "validate_data",
        "name": "validateData",
        "type": "transform",
        "position": 1,
        "config": {
          "code": `
            const customers = input.fetchCustomers.data;
            const valid = customers.filter(c => c.email && c.name);
            const invalid = customers.filter(c => !c.email || !c.name);
            return { valid, invalid, total: customers.length };
          `
        }
      },
      {
        "id": "check_validity",
        "name": "checkValidity",
        "type": "conditional",
        "position": 2,
        "config": {
          "condition": "variables.validateData.valid.length > 0",
          "trueSteps": ["transform_customers"],
          "falseSteps": ["log_error"]
        }
      },
      {
        "id": "transform_customers",
        "name": "transformCustomers",
        "type": "transform",
        "position": 3,
        "config": {
          "code": `
            return {
              customers: input.validateData.valid.map(c => ({
                id: c.id,
                fullName: c.name.toUpperCase(),
                email: c.email.toLowerCase(),
                processedAt: new Date().toISOString()
              }))
            };
          `
        }
      },
      {
        "id": "store_customers",
        "name": "storeCustomers",
        "type": "http_request",
        "position": 4,
        "config": {
          "url": "{{input.destinationUrl}}",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer {{input.destinationToken}}"
          },
          "body": {
            "customers": "{{variables.transformCustomers.customers}}"
          }
        }
      },
      {
        "id": "log_error",
        "name": "logError",
        "type": "custom_code",
        "position": 5,
        "config": {
          "language": "javascript",
          "code": `
            console.log('No valid customers found');
            return { error: true, message: 'All customers were invalid' };
          `
        }
      }
    ]
  }
}
```

## Example 6: Schedule-based Report Generator

This workflow runs on a schedule and generates reports.

**Create the workflow:**

```bash
POST /api/workflows
{
  "name": "Daily Sales Report",
  "description": "Generates and emails daily sales report",
  "rateLimitMaxConcurrent": 1,
  "retryMaxAttempts": 3
}
```

**Add a version:**

```bash
POST /api/workflows/{workflowId}/versions
{
  "definition": {
    "steps": [
      {
        "id": "fetch_sales",
        "name": "fetchSales",
        "type": "http_request",
        "position": 0,
        "config": {
          "url": "https://api.example.com/sales/yesterday",
          "method": "GET",
          "headers": {
            "Authorization": "Bearer {{input.apiToken}}"
          }
        }
      },
      {
        "id": "calculate_totals",
        "name": "calculateTotals",
        "type": "transform",
        "position": 1,
        "config": {
          "code": `
            const sales = input.fetchSales.data;
            const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
            const count = sales.length;
            return { total, count, average: total / count };
          `
        }
      },
      {
        "id": "send_report",
        "name": "sendReport",
        "type": "http_request",
        "position": 2,
        "config": {
          "url": "https://api.example.com/send-email",
          "method": "POST",
          "body": {
            "to": "manager@example.com",
            "subject": "Daily Sales Report",
            "body": "Total Sales: ${{variables.calculateTotals.total}}, Count: {{variables.calculateTotals.count}}"
          }
        }
      }
    ]
  }
}
```

**Publish the version:**

```bash
POST /api/workflows/{workflowId}/versions/{versionId}/publish
```

**Create a schedule trigger (runs daily at 9 AM):**

```bash
POST /api/workflows/{workflowId}/triggers
{
  "type": "schedule",
  "config": {
    "cron": "0 9 * * *"
  },
  "enabled": true
}
```

## Example 7: Webhook-triggered Notification System

**Create the workflow:**

```bash
POST /api/workflows
{
  "name": "Slack Notification",
  "description": "Sends notifications to Slack"
}
```

**Add version with steps:**

```bash
POST /api/workflows/{workflowId}/versions
{
  "definition": {
    "steps": [
      {
        "id": "format_message",
        "name": "formatMessage",
        "type": "transform",
        "position": 0,
        "config": {
          "code": `
            return {
              text: \`New event: \${input.event}\`,
              details: JSON.stringify(input.data, null, 2)
            };
          `
        }
      },
      {
        "id": "send_to_slack",
        "name": "sendToSlack",
        "type": "http_request",
        "position": 1,
        "config": {
          "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
          "method": "POST",
          "body": {
            "text": "{{variables.formatMessage.text}}",
            "attachments": [
              {
                "text": "{{variables.formatMessage.details}}"
              }
            ]
          }
        }
      }
    ]
  }
}
```

**Publish and create webhook trigger:**

```bash
POST /api/workflows/{workflowId}/versions/{versionId}/publish

POST /api/workflows/{workflowId}/triggers
{
  "type": "webhook",
  "config": {},
  "enabled": true
}
```

**Trigger via webhook:**

```bash
POST /api/webhooks/{triggerId}
{
  "event": "user_signup",
  "data": {
    "userId": "123",
    "email": "user@example.com"
  }
}
```

## Example 8: Python Custom Code

This workflow uses Python for data processing.

```json
{
  "name": "Python Data Analysis",
  "description": "Analyzes data using Python",
  "definition": {
    "steps": [
      {
        "id": "fetch_data",
        "name": "fetchData",
        "type": "http_request",
        "position": 0,
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET"
        }
      },
      {
        "id": "analyze_python",
        "name": "analyzePython",
        "type": "custom_code",
        "position": 1,
        "config": {
          "language": "python",
          "code": `
import statistics

numbers = [item['value'] for item in variables['fetchData']['data']]
result = {
    'mean': statistics.mean(numbers),
    'median': statistics.median(numbers),
    'stdev': statistics.stdev(numbers) if len(numbers) > 1 else 0
}
          `,
          "timeout": 10000
        }
      }
    ]
  }
}
```

## Tips and Best Practices

1. **Use descriptive step names**: Step names become variable names, so use camelCase and meaningful identifiers.

2. **Handle errors gracefully**: Add error handlers for critical steps.

3. **Test with manual triggers**: Before setting up automated triggers, test workflows manually.

4. **Monitor execution logs**: Use the execution API to check logs and debug issues.

5. **Use variables for configuration**: Pass API keys and URLs as input rather than hardcoding them.

6. **Set appropriate timeouts**: Adjust timeouts based on expected API response times.

7. **Limit loop iterations**: Always set maxIterations to prevent infinite loops.

8. **Use delays wisely**: Add delays between API calls to respect rate limits.

9. **Version your workflows**: Create new versions for changes and test before publishing.

10. **Subscribe to real-time events**: Monitor workflow execution in real-time using Socket.io.
