# 🧠 Nflow Chat Assistant – Project Roadmap & Architecture

> Status: Active
> Stack: NestJS · OpenAI Response API · Multi-Agent · Nflow Platform
> Supports: Memory · Human-in-the-Loop (HITL) · Schema Planning · Task Execution

---

## 🧭 Architecture Overview

### 🧱 Core Agents

| Agent                 | Responsibility                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Intent Agent**      | Converts user prompts into a structured intent plan (task DAG).                            |
| **Coordinator Agent** | Central orchestrator that routes tasks, manages memory and HITL, and invokes other agents. |
| **Executor Agent**    | Receives normalized tool calls from agents and triggers real Nflow API requests.           |
| **Object Agent**      | Expert in database design and object schema on the Nflow platform.                         |
| **Application Agent** | Creates or updates Nflow applications.                                                     |
| **Layout Agent**      | Creates and manages UI layout/pages in Nflow.                                              |
| **Flow Agent**        | Builds automation flows with triggers and actions.                                         |

---

## 🧠 Context Design

### `SessionContext`

Holds all memory and context for a session:

```ts
interface SessionContext {
  sessionId: string;
  chatHistory: ChatMessage[];
  application?: CreatedApplication;
  createdObjects: CreatedObject[];
  createdLayouts: CreatedLayout[];
  createdFlows: CreatedFlow[];
  intentPlan?: IntentPlan;
  toolCallsLog: ToolCall[];
  taskResults: Record<string, ExecutionResult>;
  pendingClarifications: HITLRequest[];
  timestamp: Date;
}
```

---

## 📘 Agent Input/Output Format

Each agent receives:

```ts
interface AgentInput {
  task: IntentTask;
  context: SessionContext;
}
```

Each agent returns:

```ts
interface AgentOutput {
  toolCalls: ToolCall[];
  memoryPatch?: any;
  clarification?: HITLRequest;
}
```

---

## ✅ Task Checklist (Roadmap)

### Current Progress

- **Total Progress**: 10/42 tasks completed (24%)
- **Object Agent**: 1/9 completed (11%) - PRIORITY
- **Application Agent**: 1/5 completed (20%)
- **Layout Agent**: 1/4 completed (25%)
- **Flow Agent**: 0/4 completed (0%)
- **Coordinator Agent**: 3/6 completed (50%)
- **Executor Agent**: 1/5 completed (20%)
- **Memory Service**: 1/5 completed (20%)
- **HITL & Prompt Handling**: 1/3 completed (33%)
- **Intent Agent**: 2/4 completed (50%)

### 📦 Object Agent (PRIORITY)

- [ ] Add support for CRUD on Object schema
- [V] Create Object with fields
- [ ] HITL when object not found in memory
- [ ] HITL when field is missing
- [ ] Automatically enrich with default fields
- [ ] Support relation to existing objects
- [ ] Validate enum types and picklists
- [ ] Return ToolCalls per object created
- [ ] Return MemoryPatch for created objects
- [ ] Advanced schema design recommendations
- [ ] Field type inference from descriptions

---

### 🧱 Application Agent

- [V] Create Application with metadata
- [ ] Validate unique slug and name
- [ ] Return applicationId to memory
- [ ] Handle duplicate app detection
- [ ] Return ToolCall to create_application

---

### 🗂 Layout Agent

- [V] Create layout with pages
- [ ] Validate page names
- [ ] Reference existing objects in layout (if needed)
- [ ] Return ToolCall to create_layout

---

### 🔁 Flow Agent

- [ ] Create flows with trigger/action logic
- [ ] Parse complex action logic (AI parsing)
- [ ] Support conditional and multi-action flows
- [ ] Return ToolCall to create_flow

---

### 🧠 Coordinator Agent

- [V] Dispatch tasks to agents in plan
- [V] Collect ToolCalls from agents
- [V] Pass to Executor Agent
- [ ] Apply memory patches
- [ ] Track HITL and queue unanswered clarifications
- [ ] Resolve dependsOn chain

---

### ⚙️ Executor Agent

- [V] Accept normalized tool calls
- [ ] Route to correct Nflow service (REST client)
- [ ] Retry failed calls with backoff
- [ ] Log success/failure status
- [ ] Store result in `taskResults`

---

### 🧠 Memory Service

- [V] `getContext(sessionId)`
- [ ] `patch(context, patchData)`
- [ ] `reset(sessionId)`
- [ ] `findObjectByName`
- [ ] `getLastCreatedApplication()`

---

### 🧠 HITL & Prompt Handling

- [V] Agent can return `HITLRequest` if ambiguous/missing
- [ ] Coordinator pauses and asks user
- [ ] Response gets injected back into pending task

---

### 🧩 Intent Agent (Tool Schema)

- [V] Supports `create_intent_plan` tool
- [V] Task format with agent, description, data, dependsOn
- [ ] Each task includes ID
- [ ] Data supports per-agent structure (application, object, layout, flow)

---

## 📚 Definitions & References

### ✅ ToolCall

```ts
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

### ✅ HITLRequest

```ts
interface HITLRequest {
  prompt: string;
  taskId: string;
  missing: string[];
}
```

### ✅ CreatedObject (from memory)

```ts
interface CreatedObject {
  objectId: string;
  name: string;
  fields: Field[];
}
```

### ✅ Field

```ts
interface Field {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: any;
  options?: any[];
  relation?: {
    targetObject: string;
    type: RelationType;
  };
}
```

---

## 💡 Suggestions & Improvements

- [ ] Refactor tool schemas into separate `openai/tools/` module
- [ ] Auto-validate plan DAG and detect circular dependencies
- [ ] Use Zod schema to validate agent outputs
- [ ] Store session context in Redis for scaling
- [ ] Add logs per toolCall for debugging
- [ ] Add custom dev UI for HITL
- [ ] Implement memory indexing for faster object lookup
- [ ] Add support for context-aware field recommendations
- [ ] Build schema visualization tools

---

## 🧪 Test Scenarios

| Case                            | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| ✅ Create App → Create Object   | User creates app, then objects in it                        |
| 🧠 HITL – Missing fields        | User says "Create object Account" → system asks for fields  |
| 🧱 Circular Task Detection      | FlowAgent task depends on ObjectAgent → validated chain     |
| 🔁 Full chain                   | App → Object → Layout → Flow with memory and context passed |
| 📝 Object Schema Modification   | Update existing object by adding/removing fields            |
| 🔄 Object Relationship Creation | Create objects with relationships to existing objects       |

---

## 📈 Metrics To Track

- [ ] Number of tool calls made per session
- [ ] HITL trigger rate
- [ ] Memory patch success rate
- [ ] Agent task latency
- [ ] Object schema complexity score
- [ ] User satisfaction with schema recommendations

---

## 🚩 Next Steps (Priority Order)

1. Complete the Object Agent HITL capabilities

   - Implement field missing detection and user prompting
   - Add object not found detection with creation suggestion

2. Implement Memory Service functions

   - Complete `patch(context, patchData)` for updating context
   - Add `findObjectByName` for object retrieval

3. Enhance Coordinator Agent for HITL and context awareness

   - Track and queue clarifications
   - Apply memory patches from agents

4. Improve Object Agent database design capabilities
   - Add field type inference
   - Implement relationship recommendations
   - Add schema validation

---
