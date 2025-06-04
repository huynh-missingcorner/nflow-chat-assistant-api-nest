# Application Agent Updates - CRUD Operations Support

## Overview

The Application Agent has been updated to support full CRUD (Create, Read, Update, Delete) operations for applications on the Nflow platform. This update enables the agent to handle different operation types while integrating with the existing NFlow REST API.

## Key Changes

### 1. Operation Type Support

Added support for three distinct application operations:

- `create_application` - Creates new applications
- `update_application` - Updates existing applications
- `delete_application` - Removes applications

### 2. Enhanced State Management

**Updated Types (`application-graph-state.types.ts`)**:

- Added `ApplicationOperationType` union type
- Extended `ApplicationSpec` with `operationType` field
- Enhanced `EnrichedApplicationSpec` with NFlow-specific fields (`profiles`, `tagNames`, `credentials`)
- Simplified `ApplicationExecutionResult` to focus on operation outcomes

**User ID Resolution**:

- `userId` is obtained from `chatSessionId` using `ChatSessionService.getUserIdFromChatSession()`
- No need to pass `userId` directly in the state
- Maintains security by validating session ownership

### 3. AppDesignNode Enhancements

**Operation-Specific Logic**:

- Different system prompts based on operation type
- Minimal specification for delete operations (no object/layout/flow generation)
- Full specification enhancement for create operations
- Update-focused prompts for modification operations

**Key Methods**:

- `getSystemPromptForOperation()` - Returns appropriate prompts per operation
- `createMinimalDeleteSpec()` - Generates lightweight specs for deletions
- `generateEnrichedSpec()` - Creates operation-aware specifications

### 4. AppExecutorNode Integration

**Parameter-Based Execution**:

- Uses API parameters extracted by AppDesignNode from LLM tool calls
- Direct REST API calls using structured parameters
- No parameter generation logic - relies on tool extraction
- Proper error handling and logging

**Operation Handlers**:

- `createApplication()` - Uses CreateApplicationDto from apiParameters
- `updateApplication()` - Uses UpdateApplicationDto from apiParameters
- `deleteApplication()` - Uses application names from apiParameters

**Key Features**:

- `getUserId()` - Extracts userId from chatSessionId securely
- Parameter validation before API calls
- Comprehensive error handling with typed responses

## Tool-Based Parameter Extraction

### How It Works

1. **AppDesignNode**:

   - Uses LLM with operation-specific tools (`createNewApplicationTool`, `updateApplicationTool`, `removeApplicationsTool`)
   - LLM extracts and structures the correct parameters based on user input
   - Stores extracted parameters in `enrichedSpec.apiParameters`

2. **AppExecutorNode**:
   - Receives enriched spec with pre-structured API parameters
   - Validates parameters are present
   - Makes direct API calls using the extracted parameters
   - No parameter transformation or generation needed

### Tool Usage by Operation

| Operation            | Tool Used                  | Parameters Extracted                                                        |
| -------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `create_application` | `createNewApplicationTool` | `name`, `displayName`, `description`, `profiles`, `tagNames`, `credentials` |
| `update_application` | `updateApplicationTool`    | `name`, `displayName`, `description`, `profiles`, `credentials`             |
| `delete_application` | `removeApplicationsTool`   | `names` (array of application names)                                        |

### Benefits of Tool-Based Approach

1. **LLM-Driven Parameter Extraction**: AI handles complex parameter mapping from natural language
2. **Validation**: Tools provide schema validation for parameters
3. **Flexibility**: Easy to modify parameter structures by updating tool schemas
4. **Separation of Concerns**: Design node handles AI/parameter extraction, executor handles API calls
5. **Consistency**: Same tools can be used across different agent implementations

## Architecture Benefits

### Clean Separation of Concerns

- AppDesignNode: Handles specification enhancement and validation
- AppExecutorNode: Manages actual API interactions
- Operation-specific logic without code duplication

### Domain Isolation

- Removed object/layout/flow creation logic from application domain
- Agents will be created separately for those domains
- Focused single-responsibility design

### Extensibility

- Easy to add new operation types
- Pluggable operation handlers
- Consistent error handling patterns

## Usage Examples

### Create Application

```typescript
const state: ApplicationStateType = {
  operationType: 'create_application',
  chatSessionId: 'session-123', // userId will be resolved from this
  applicationSpec: {
    appName: 'My New App',
    description: 'A sample application',
    operationType: 'create_application',
    // ... other fields
  },
};
```

### Update Application

```typescript
const state: ApplicationStateType = {
  operationType: 'update_application',
  chatSessionId: 'session-123', // userId will be resolved from this
  applicationSpec: {
    appName: 'My Updated App',
    description: 'Updated description',
    operationType: 'update_application',
    // ... other fields
  },
};
```

### Delete Application

```typescript
const state: ApplicationStateType = {
  operationType: 'delete_application',
  chatSessionId: 'session-123', // userId will be resolved from this
  applicationSpec: {
    appName: 'App To Delete',
    operationType: 'delete_application',
  },
};
```

## Security and User Context

The implementation ensures proper security and user context management:

- **Session Validation**: The `ChatSessionService.getUserIdFromChatSession()` method validates that the chat session exists and belongs to the authenticated user
- **Authorization**: Only the user who owns the chat session can perform operations
- **Error Handling**: Proper exceptions are thrown for unauthorized access or missing sessions
- **Clean Architecture**: User ID resolution is abstracted away from the business logic

## Error Handling

The updated implementation includes comprehensive error handling:

- Input validation for required fields
- NFlow API error propagation
- Typed error responses
- Detailed logging for debugging

## Future Enhancements

1. **Validation Integration**: Add integration with existing validation tools
2. **Batch Operations**: Support for bulk application operations
3. **Rollback Support**: Implement transaction-like rollback capabilities
4. **Audit Logging**: Enhanced tracking of application changes
5. **Cache Integration**: Add caching for improved performance

## Testing

Ensure to test:

- All three operation types with valid inputs
- Error scenarios (missing fields, API failures)
- Integration with existing application graph workflow
- NFlow API authentication and authorization

## Migration Notes

- Existing application creation flows remain compatible
- New operation type field is optional for backward compatibility
- Enhanced error handling provides better debugging information
