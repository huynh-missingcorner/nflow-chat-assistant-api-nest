# Technical Specification: LangChain and LangGraph Integration

## Overview

This document provides the technical specification for integrating LangChain.js and LangGraph.js into the Nflow AI Assistant API, replacing the current custom agent implementation with a graph-based agent architecture.

## Architecture

### Current Architecture

The current architecture relies on a custom implementation of agents with manual coordination:

```
User Message → Coordinator Agent → Intent Agent → Task Execution → Executor Agent → Response
                      ↓
              Classifier Agent
                      ↓
        Application/Object/Layout/Flow Agents
```

Each agent extends the `BaseAgentService` class and implements its own `run` method. Communication between agents is managed through direct service calls, and state is passed explicitly between components.

### Proposed Architecture

The new architecture will utilize LangGraph's graph-based workflow system:

```
                  ┌─────────────────────────┐
                  │       Agent Graph       │
                  │  ┌─────────────────┐    │
                  │  │  Coordinator    │    │
User Message ────►│  │  (Entry Node)   │    │
                  │  └────────┬────────┘    │
                  │           │             │
                  │  ┌────────▼────────┐    │
                  │  │    Classifier   │    │
                  │  └────────┬────────┘    │
                  │           │             │
                  │  ┌────────▼────────┐    │         ┌─────────────────┐
                  │  │     Intent      ◄────┼─────────┤   Memory Hub    │
                  │  └────────┬────────┘    │         │                 │
                  │           │             │         │  - Short-term   │
                  │  ┌────────▼────────┐    │         │  - Long-term    │
                  │  │ Domain Agents   │    │◄───────►│  - Conversation │
                  │  │                 │    │         └─────────────────┘
                  │  │ - Application   │    │
                  │  │ - Object        │    │         ┌─────────────────┐
                  │  │ - Layout        │    │         │                 │
                  │  │ - Flow          │    │◄───────►│   Tools Hub     │
                  │  └────────┬────────┘    │         │                 │
                  │           │             │         └─────────────────┘
                  │  ┌────────▼────────┐    │
                  │  │    Executor     │    │
                  │  └────────┬────────┘    │
                  │           │             │
Response         ◄├───────────┘             │
                  └─────────────────────────┘
```

## Implementation Details

### 1. Core Graph Structure

#### 1.1 State Definition

```typescript
interface AgentGraphState {
  // Current conversation context
  messages: BaseMessage[];

  // Last active node in the graph
  sender?: string;

  // Memory components
  memory: {
    shortTerm: ShortTermMemory;
    conversationHistory: BaseMessage[];
  };

  // Tasks and results from intent agent
  tasks?: IntentTask[];
  taskResults?: Record<string, AgentOutput>;

  // Human-in-the-loop data
  pendingHITL?: Record<string, HITLRequest>;

  // Current execution step
  currentStep?: string;

  // Error information
  error?: {
    message: string;
    node: string;
    recoverable: boolean;
  };
}
```

#### 1.2 Node Types

1. **Agent Nodes**: Execute LLM-based reasoning tasks

   - `CoordinatorNode`: Entry point for user messages
   - `ClassifierNode`: Message classification
   - `IntentNode`: Task planning
   - `ApplicationNode`, `ObjectNode`, `LayoutNode`, `FlowNode`: Domain-specific agents
   - `ExecutorNode`: Result execution and response generation

2. **Utility Nodes**: Handle non-LLM operations
   - `MemoryNode`: Manages memory operations
   - `ToolCallNode`: Executes tool calls
   - `HITLNode`: Handles human-in-the-loop interactions

#### 1.3 Edge Types

1. **Standard Edges**: Normal flow between nodes
2. **Conditional Edges**: Flow determined by condition functions
3. **Error Edges**: Flow in case of errors

### 2. Agent Implementation

#### 2.1 Base Agent Node

```typescript
abstract class BaseLangChainAgentService<
  TInput extends Record<string, any>,
  TOutput extends Record<string, any>,
> {
  constructor(
    protected readonly llmService: LangChainLLMService,
    protected readonly contextLoader: ContextLoaderService,
    protected readonly agentPath: string,
  ) {}

  // The main method that LangGraph will call
  abstract invoke(
    state: AgentGraphState,
    config?: RunnableConfig,
  ): Promise<Partial<AgentGraphState>>;

  // Method to load context files (preserved from existing architecture)
  protected async loadAgentContexts(): Promise<string> {
    // Implementation preserved from BaseAgentService
  }

  // Helper method to create a LangChain prompt from context files
  protected async createPrompt(): Promise<ChatPromptTemplate> {
    const context = await this.loadAgentContexts();
    return ChatPromptTemplate.fromMessages([
      ['system', context],
      new MessagesPlaceholder('messages'),
    ]);
  }
}
```

#### 2.2 Example Agent Implementation: IntentAgent

```typescript
@Injectable()
export class LangChainIntentAgentService extends BaseLangChainAgentService<
  IntentAgentInput,
  IntentAgentOutput
> {
  constructor(
    private readonly llmService: LangChainLLMService,
    contextLoader: ContextLoaderService,
  ) {
    super(llmService, contextLoader, AGENT_PATHS.INTENT);
  }

  async invoke(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    // Create the intent agent with tools
    const agent = await this.createIntentAgent();

    // Get the latest user message
    const userMessage = state.messages[state.messages.length - 1];

    // Invoke the agent
    const result = await agent.invoke({
      messages: state.messages,
      memory: state.memory,
    });

    // Extract tasks from the result
    const tasks = result.tasks || [];

    // Return updated state
    return {
      tasks,
      currentStep: 'intent_complete',
    };
  }

  private async createIntentAgent(): Promise<RunnableSequence> {
    const prompt = await this.createPrompt();
    const model = this.llmService.getOpenAIChat({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.2,
    });

    // Convert existing tools to LangChain tools
    const tools = await this.convertTools();

    return RunnableSequence.from([prompt, model, new JsonOutputParser<IntentAgentOutput>()]);
  }

  private async convertTools(): Promise<Tool[]> {
    // Convert existing tools to LangChain Tool format
    return intentTools.map(
      (tool) =>
        new DynamicTool({
          name: tool.name,
          description: tool.description,
          func: async (input: string) => {
            // Implementation
          },
        }),
    );
  }
}
```

### 3. Graph Definition

```typescript
export function createAgentGraph() {
  // Define the state
  const state = typedState<AgentGraphState>();

  // Create agent nodes
  const coordinatorNode = createNodeFromRawAction(
    coordinatorAgentService.invoke.bind(coordinatorAgentService),
  );

  const classifierNode = createNodeFromRawAction(
    classifierAgentService.invoke.bind(classifierAgentService),
  );

  const intentNode = createNodeFromRawAction(intentAgentService.invoke.bind(intentAgentService));

  // Define other nodes similarly...

  // Create the graph
  const workflow = new StateGraph<AgentGraphState>({
    channels: state,
    nodes: {
      coordinator: coordinatorNode,
      classifier: classifierNode,
      intent: intentNode,
      application: applicationNode,
      object: objectNode,
      layout: layoutNode,
      flow: flowNode,
      executor: executorNode,
      memory: memoryNode,
      toolCall: toolCallNode,
      hitl: hitlNode,
    },
  });

  // Define graph edges
  workflow.addEdge('coordinator', 'classifier');

  // Add conditional edges
  workflow.addConditionalEdges(
    'classifier',
    (state) => {
      const messageType = state.messageType;
      if (messageType === MessageType.NFLOW_RELATED) {
        return 'intent';
      } else {
        return 'casual';
      }
    },
    {
      intent: 'intent',
      casual: 'casual_chat',
    },
  );

  // Add more edges...

  // Compile the graph
  return workflow.compile();
}
```

### 4. Tool Integration

#### 4.1 Tool Conversion

Tools will be converted from the current custom format to LangChain's Tool format:

```typescript
export function convertCustomToolsToLangChainTools(customTools: FunctionTool[]): Tool[] {
  return customTools.map((tool) => {
    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: z.object(convertJsonSchemaToZod(tool.parameters)),
      func: async (input: Record<string, any>) => {
        // Implementation that calls the existing tool handler
        return await executeToolFunction(tool.name, input);
      },
    });
  });
}
```

#### 4.2 Tool Execution

```typescript
export class ToolCallNode {
  async invoke(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    const { toolCalls } = state;

    if (!toolCalls || toolCalls.length === 0) {
      return { currentStep: 'tool_calls_complete' };
    }

    const results = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
          const result = await this.executeToolCall(toolCall);
          return { id: toolCall.id, result };
        } catch (error) {
          return {
            id: toolCall.id,
            error: error.message,
          };
        }
      }),
    );

    return {
      toolCallResults: results,
      currentStep: 'tool_calls_complete',
    };
  }

  private async executeToolCall(toolCall: ToolCall) {
    // Implementation to execute the tool call
    // This would use the existing tool execution logic
  }
}
```

### 5. Memory Integration

#### 5.1 Memory Service

```typescript
@Injectable()
export class LangChainMemoryService {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly prisma: PrismaService,
  ) {}

  async getMemory(chatSessionId: string): Promise<ShortTermMemory> {
    // Use existing memory service but adapt for LangChain
    const memory = await this.memoryService.getContext(chatSessionId);
    return this.convertToLangChainMemory(memory);
  }

  async updateMemory(chatSessionId: string, update: Partial<ShortTermMemory>): Promise<void> {
    await this.memoryService.patch(await this.memoryService.getContext(chatSessionId), update);
  }

  private convertToLangChainMemory(memory: ShortTermMemory): LangChainMemory {
    // Convert existing memory format to LangChain memory format
    return {
      messages: memory.chatHistory.map(convertToChatMessage),
      // Other conversions as needed
    };
  }
}
```

#### 5.2 Memory Node

```typescript
export class MemoryNode {
  constructor(private readonly memoryService: LangChainMemoryService) {}

  async invoke(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    // Load memory if not already present
    if (!state.memory) {
      const memory = await this.memoryService.getMemory(state.chatSessionId);
      return { memory };
    }

    // Update memory with new information
    if (state.memoryUpdate) {
      await this.memoryService.updateMemory(state.chatSessionId, state.memoryUpdate);

      // Return updated memory
      return {
        memory: {
          ...state.memory,
          ...state.memoryUpdate,
        },
      };
    }

    return {};
  }
}
```

### 6. Human-in-the-Loop Integration

```typescript
export class HITLNode {
  async invoke(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    if (!state.pendingHITL || Object.keys(state.pendingHITL).length === 0) {
      return { currentStep: 'hitl_not_needed' };
    }

    const [taskId, hitlRequest] = Object.entries(state.pendingHITL)[0];

    // Return state with HITL request
    return {
      requiresHITL: true,
      hitlData: {
        taskId,
        prompt: hitlRequest.prompt,
        options: hitlRequest.options,
        remainingTasks: state.tasks,
      },
      currentStep: 'awaiting_hitl',
    };
  }

  async processHITLResponse(
    state: AgentGraphState,
    response: HITLResponse,
  ): Promise<Partial<AgentGraphState>> {
    // Process the human response and update state
    const pendingHITL = { ...state.pendingHITL };
    delete pendingHITL[response.taskId];

    return {
      pendingHITL,
      hitlResponse: response,
      currentStep: 'hitl_complete',
    };
  }
}
```

### 7. Integration with NestJS

#### 7.1 LangChain Module

```typescript
@Module({
  imports: [
    OpenAIModule,
    // Other dependencies
  ],
  providers: [
    LangChainLLMService,
    {
      provide: 'AGENT_GRAPH',
      useFactory: (
        coordinatorAgentService: LangChainCoordinatorAgentService,
        // Other services
      ) => {
        return createAgentGraph(
          coordinatorAgentService,
          // Other services
        );
      },
      inject: [
        LangChainCoordinatorAgentService,
        // Other services
      ],
    },
    LangChainAgentGraphService,
  ],
  exports: [LangChainAgentGraphService],
})
export class LangChainModule {}
```

#### 7.2 Agent Graph Service

```typescript
@Injectable()
export class LangChainAgentGraphService {
  constructor(
    @Inject('AGENT_GRAPH') private readonly agentGraph: CompiledStateGraph<AgentGraphState>,
    private readonly memoryService: LangChainMemoryService,
  ) {}

  async processUserMessage(
    message: string,
    chatSessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    // Get memory for the session
    const memory = await this.memoryService.getMemory(chatSessionId);

    // Initialize graph state
    const initialState: AgentGraphState = {
      messages: [...memory.chatHistory, new HumanMessage(message)],
      memory,
      chatSessionId,
    };

    // Execute the graph
    const { result, events } = await this.agentGraph.invoke(initialState, {
      configurable: { sessionId: chatSessionId },
    });

    // Check if HITL is required
    if (result.requiresHITL) {
      return {
        reply: result.hitlData.prompt,
        requiresHITL: true,
        hitlData: result.hitlData,
      };
    }

    // Return normal response
    return {
      reply: result.reply || '',
    };
  }

  async continueFromHITL(
    hitlResponse: HITLResponse,
    chatSessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    // Get the current graph state
    const currentState = await this.agentGraph.getState(chatSessionId);

    // Process the HITL response
    const { result } = await this.agentGraph.continue(
      {
        ...currentState,
        hitlResponse,
      },
      { configurable: { sessionId: chatSessionId } },
    );

    return {
      reply: result.reply || '',
    };
  }
}
```

## Testing Strategy

### 1. Unit Tests

1. **Node-level testing**:

   - Test each agent node in isolation
   - Mock dependencies and state
   - Verify output state structure

2. **Tool Testing**:
   - Test converted tools
   - Verify argument handling
   - Test error scenarios

### 2. Integration Tests

1. **Graph-level testing**:

   - Test complete graph execution
   - Verify node transitions
   - Test conditional paths

2. **State persistence testing**:
   - Test saving and loading graph state
   - Verify state integrity

### 3. End-to-End Tests

1. **Full workflow testing**:
   - Simulate user interactions
   - Verify correct responses
   - Test error recovery

## Migration Strategy

To minimize risk, we'll use a gradual migration approach:

1. **Phase 1: Framework Integration**

   - Add required dependencies
   - Create adapters between existing code and new framework
   - Set up basic graph structure

2. **Phase 2: Parallel Implementation**

   - Implement new agent system alongside existing one
   - Feature flag to toggle between implementations
   - Comprehensive testing

3. **Phase 3: Gradual Rollout**

   - Start with low-risk features
   - A/B testing with users
   - Monitor performance and errors

4. **Phase 4: Complete Migration**
   - Switch to new implementation
   - Remove deprecated code
   - Optimize performance

## Dependencies

- LangChain.js: `^0.1.0`
- LangGraph.js: `^0.0.16`
- NestJS: Current version
- OpenAI SDK: Current version

## Performance Considerations

1. **LLM Cost Optimization**

   - Minimize redundant LLM calls
   - Optimize prompt sizes
   - Use appropriate models for each task

2. **Caching**

   - Cache frequently used contexts
   - Cache common tool results
   - Implement memory retrieval caching

3. **Streaming Support**
   - Enable streaming for improved UX
   - Implement partial result handling
   - Support incremental updates

## Security Considerations

1. **State Encryption**

   - Encrypt sensitive information in state
   - Implement proper access controls

2. **Tool Permissions**

   - Define access limits for tools
   - Validate tool inputs
   - Audit tool usage

3. **HITL Safeguards**
   - Verify human authority
   - Implement timeout mechanisms
   - Provide override capabilities
