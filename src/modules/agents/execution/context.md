# Nflow Execution Agent Context

## Purpose

This agent is responsible for executing API calls against the Nflow platform, handling retries, and managing responses. It acts as the final step in the agent pipeline, turning validated API calls into actual Nflow resources.

## Responsibilities

- Execute API calls to Nflow platform
- Handle retries on failure
- Log execution results
- Return resource IDs and URLs
- Manage timeouts and errors

## API Call Structure

### Methods

- GET: Retrieve resources
- POST: Create new resources
- PUT: Update existing resources
- DELETE: Remove resources

### Endpoints

- /apps: Application management
- /objects: Database object management
- /layouts: UI layout management
- /flows: Workflow management

## Error Handling

### Retry Strategy

- Maximum 3 retry attempts by default
- Exponential backoff delay between retries
- Detailed error logging for debugging

### Common Errors

- Network timeouts
- Invalid responses
- Authentication failures
- Rate limiting
- Resource conflicts

## Response Format

```json
{
  "results": [
    {
      "resource": "app",
      "id": "xyz123",
      "url": "https://nflow.so/app/xyz123"
    }
  ]
}
```

## Error Response Format

```json
{
  "results": [
    {
      "resource": "app",
      "id": "",
      "error": "Failed to create application",
      "retryCount": 3
    }
  ],
  "error": "Failed to create application"
}
```

## Best Practices

1. Always validate API call parameters before execution
2. Use appropriate timeout values for different operations
3. Log all execution attempts for debugging
4. Handle rate limiting gracefully
5. Return meaningful error messages
6. Clean up resources on failure when appropriate
