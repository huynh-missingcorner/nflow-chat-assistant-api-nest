# **🧱 STEP-BY-STEP DEVELOPMENT PLAN (PHASE 1: OBJECT DOMAIN)**

---

## **🔧 STEP 1: Project Initialization**

### **✅ 1.1 Setup NestJS Monorepo (if not already)**

```
pnpm create nest-app my-agent-system
cd my-agent-system
pnpm install --save @nestjs/config ioredis typeorm pg reflect-metadata
pnpm install --save langchain langgraph openai zod
```

### **✅ 1.2 Folder Structure**

```
src/
├── orchestrator/               # Coordinator + router logic
├── memory/                     # Redis/Context/Vector services
├── agents/
│   ├── shared/                 # Conflict + HIL
│   └── object/                # All object-related agents
├── langgraph/                  # Graph factory + state
├── tools/                      # LangChain tools
├── services/                   # Nflow API, schema cache, audit
├── common/                     # Types, schemas, constants
└── main.ts
```

---

## **🧠 STEP 2: Shared Infra Components**

### **✅ 2.1 Redis Memory Service**

```
// memory/context-memory.service.ts
@Injectable()
export class ContextMemoryService {
  constructor(private readonly redis: Redis) {}

  async set(threadId: string, key: string, value: any) {
    await this.redis.set(`${threadId}:${key}`, JSON.stringify(value));
  }

  async get<T>(threadId: string, key: string): Promise<T | null> {
    const value = await this.redis.get(`${threadId}:${key}`);
    return value ? JSON.parse(value) : null;
  }
}
```

---

## **🧠 STEP 3: Shared Agents**

### **✅ 3.1 CoordinatorAgent**

- Input: user prompt (text)
- Output:

```
{
  domain: "object",
  intent: "add_field",
  target: "Employee",
  params: {...}
}
```

- Tool: IntentClassifierTool (LangChain tool with enum schema or OpenAI function)
- Use LangChain Runnable:

```
const coordinator = RunnableSequence.from([
  promptTemplate,
  llmWithIntentSchema
])
```

---

### **✅ 3.2 ConflictResolutionAgent**

- Input:

```
{ message: "Which object?", choices: ["Customer", "Client"] }
```

- Output: { chosen: "Customer" }
- Use ChoicePromptTool + system message prompt

---

### **✅ 3.3 HumanInLoopAgent**

- Input: { action: "delete_object", objectName: "LegacyUser" }
- Waits for confirmation signal (via Redis key + webhook resume)

---

## **🧱 STEP 4: Object Domain — Understanding**

### **✅ 4.1 FieldUnderstandingAgent**

- Input: "Add a required json field for settings"
- Output:

```
{
  field: {
    name: "settings",
    typeHint: "json",
    required: true,
    description: "..."
  }
}
```

- Uses LangChain function tool with Zod schema

---

### **✅ 4.2 ObjectUnderstandingAgent**

- Input: "Create object Customer with name, email, status"
- Output:

```
{
  objectName: "Customer",
  fields: [
    { name: "name", typeHint: "text" },
    { name: "email", typeHint: "text" },
    { name: "status", typeHint: "picklist" }
  ]
}
```

- Internally uses FieldUnderstandingAgent for each field phrase

---

## **🧠 STEP 5: Object Domain — Planning**

### **✅ 5.1 DBDesignAgent**

- Accepts structured object or field input
- Loads schema via ContextMemoryService or NflowService
- Detects duplicates
- Output:

```
{ valid: true, objectId: "customer_123", fieldExists: false }
```

---

### **✅ 5.2 TypeMapperAgent**

- Converts type hints → final API-ready field types
- Looks up objectId for relation fields, picklist IDs, etc.
- Output:

```
{ field: { name: "status", type: "picklist", options: ["active", "inactive"] } }
```

---

## **⚙️ STEP 6: Object Domain — Execution**

### **✅ 6.1 ObjectExecutorAgent**

- Input:

```
{
  action: "add_field",
  objectId: "customer_123",
  field: { name: "status", type: "picklist", ... }
}
```

- Uses NflowService to send API request
- POST or PATCH object or field

---

## **🔁 STEP 7: LangGraph Integration**

### **✅ 7.1 Build Object Flow**

- Entry: CoordinatorAgent
- Conditional → ObjectUnderstandingAgent / FieldUnderstandingAgent
- Sequence:
  - Understanding
  - DBDesignAgent
  - TypeMapperAgent
  - ObjectExecutorAgent
  - (optional) ConflictResolutionAgent
  - (optional) HumanInLoopAgent

Use LangGraphJS createGraph() with .addNode() and .addConditionalEdge().

```
graph.addNode("coordinator", coordinatorRunnable)
graph.addConditionalEdges("coordinator", (output) => {
  if (output.intent === "create_object") return "objectUnderstanding"
  if (output.intent === "add_field") return "fieldUnderstanding"
})
```

---

## **📦 STEP 8: API Integration in NestJS**

```
@Controller('agent')
export class AgentController {
  constructor(private readonly langgraph: LangGraphService) {}

  @Post()
  async runAgent(@Body() input: { message: string, threadId: string }) {
    return await this.langgraph.run(input.threadId, input.message);
  }
}
```

---

## **🧪 STEP 9: Test Setup**

### **✅ 9.1 Unit Tests**

- CoordinatorAgent: intent classification
- FieldUnderstandingAgent: spec extraction
- TypeMapperAgent: type mapping
- ObjectExecutorAgent: dry-run mode

### **✅ 9.2 End-to-End Scenarios**

- “Create object Customer with name, status”
- “Add a json field settings to Customer”

---

## **✅ Phase 1 Completion Criteria**

| **Feature**                      | **Required** |
| -------------------------------- | ------------ |
| CoordinatorAgent                 | ✅           |
| Field + ObjectUnderstandingAgent | ✅           |
| DBDesignAgent + TypeMapperAgent  | ✅           |
| ObjectExecutorAgent              | ✅           |
| Redis memory + logging           | ✅           |
| HIL + Conflict support           | ✅           |
| LangGraph integrated             | ✅           |
| NestJS API exposed               | ✅           |
| E2E tests passing                | ✅           |
