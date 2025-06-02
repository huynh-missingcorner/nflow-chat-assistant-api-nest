# Reference Blueprint — Nflow Multi-Agent System

---

## **1 · High-Level Component Map**

| **Layer**         | **Components**                                                                            | **Key Responsibilities**                                   |
| ----------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **UX / Entry**    | Chat UI → **Gateway** (NestJS controller)                                                 | Receive user prompt, format first-turn request             |
| **Orchestration** | **CoordinatorAgent** (Orchestrator-Worker pattern)                                        | Intent classification, domain routing, high-level plan     |
| **Understanding** | _UnderstandingAgents_ (one per domain)                                                    | Parse rich natural-language → structured spec JSON         |
| **Planning**      | _PlannerAgents_ (per domain)                                                              | Add defaults, validate spec, complete missing info         |
| **Execution**     | _ExecutorAgents_ (per domain)                                                             | Build correct REST payload, call Nflow API, retry/rollback |
| **Assistance**    | ConflictResolutionAgent, HumanInLoopAgent                                                 | Disambiguation; confirmation of risky ops                  |
| **Memory + Data** | ContextMemoryService (volatile Redis) · VectorStore (pgvector) · SQL/Postgres (long-term) | Short-term graph state, semantic search, audit log         |

> Workflow skeleton
>
> **Chat UI → Coordinator → (Understanding → Planner → Executor)+ → Memory update → Chat UI**

---

## **2 · Shared / Cross-Cutting Agents**

| **Agent**                   | **Purpose**                                    | **Typical Input (example)**                | **Typical Output (example)**                           | **Tools**                     |
| --------------------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ | ----------------------------- |
| **CoordinatorAgent**        | Detect intent, choose domain, minimal history  | "Add username field to the users object"   | {intent:"update_object",domain:"object",details:{...}} | IntentClassifierTool (LLM fn) |
| **ConflictResolutionAgent** | Ask user which entity they meant when >1 match | {candidates:["Customer","CustomerData"]}   | {chosen:"Customer"}                                    | ChoicePromptTool              |
| **HumanInLoopAgent**        | Confirm destructive / production-critical ops  | {action:"delete_object",object:"Customer"} | {confirmed:true}                                       | ConfirmActionTool             |
| **ContextMemoryService**    | Redis hash keyed by app                        | object                                     | layout                                                 | flow                          |
| **VectorStore**             | Store docs, specs, prompts for semantic recall | —                                          | —                                                      | pgvector / Redis-Fagin        |

---

## **3 · Domain-Specific Agent Sets**

### **3.1 Object Domain**

| **Stage**     | **Agent**                   | **Purpose**                            | **Input**                                            | **Output**                                                                        | **Tools**                            |
| ------------- | --------------------------- | -------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| Understanding | **FieldUnderstandingAgent** | Extract field spec from NL             | "Add required json field …"                          | {field:{name:"custom_information",typeHint:"json",required:true,description:"…"}} | FieldExtractionTool                  |
| Planning      | **DBDesignAgent**           | Check object exists, field duplication | {object:"users", field:{…}} + _context users schema_ | {fieldExists:false,objectId:"users_1234"}                                         | ObjectLookupTool, FieldExistenceTool |
| Planning      | **TypeMapperAgent**         | SQL/Hint → Nflow datatype              | {field:{name:"custom_information",typeHint:"json"}}  | {field:{name:"custom_information",type:"json"}}                                   | TypeMappingTool                      |
| Execution     | **ObjectExecutorAgent**     | PATCH/POST to /objects                 | {objectId:"users_1234",addField:{…}}                 | {status:"success",updated:["custom_information"]}                                 | UpdateObjectTool (+retry)            |

### **3.2 Application Domain**

| **Stage**     | **Agent**                 | **Purpose**                            | **Input**                             | **Output**                                                      |
| ------------- | ------------------------- | -------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Understanding | **AppUnderstandingAgent** | Parse high-level app request           | "Build a CRM app with Customer, Lead" | {appName:"CRM",objects:["Customer","Lead"],layouts:[],flows:[]} |
| Planning      | **AppDesignAgent**        | Enrich spec, generate IDs, skeleton    | spec + defaults                       | {app:{id:"app_987",…},objects:[…],layouts:[…]}                  |
| Execution     | **AppExecutorAgent**      | POST /applications then fire sub-tasks | Enriched spec                         | {appId:"app_987",objectIds:[…]}                                 |

### **3.3 Layout Domain**

| **Stage**     | **Agent**                    | **Purpose**                  | **Input**                        | **Output**                                                             |
| ------------- | ---------------------------- | ---------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Understanding | **LayoutUnderstandingAgent** | Parse layout desires         | "Make an edit form for Customer" | {layoutName:"Customer Edit",object:"Customer",fields:["name","email"]} |
| Planning      | **LayoutPlannerAgent**       | Produce full layout DSL JSON | spec + object schema             | {dsl:{…}}                                                              |
| Execution     | **LayoutExecutorAgent**      | POST/PUT /layouts            | DSL                              | {layoutId:"lay_123"}                                                   |

### **3.4 Flow Domain**

| **Stage**     | **Agent**                  | **Purpose**               | **Input**                          | **Output**                                     |
| ------------- | -------------------------- | ------------------------- | ---------------------------------- | ---------------------------------------------- |
| Understanding | **FlowUnderstandingAgent** | Parse trigger/action/cond | "When form submitted, email admin" | {trigger:"form_submit",actions:["send_email"]} |
| Planning      | **FlowPlannerAgent**       | Map to Nflow Flow DSL     | spec + env info                    | {dsl:{trigger:{…},actions:[…]}}                |
| Execution     | **FlowExecutorAgent**      | POST/PUT /flows           | DSL                                | {flowId:"flow_456"}                            |

---

## **4 · Databases / Memory Choices**

| **Store**                  | **Tech**         | **Purpose**                                             | **TTL**    |
| -------------------------- | ---------------- | ------------------------------------------------------- | ---------- |
| **Redis**                  | volatile memory  | Graph node state (current app/object), rate-limit locks | hours-days |
| **PostgreSQL**             | relational store | Audit log of each user turn, agent I/O, error traces    | forever    |
| **pgvector / RedisVector** | vector embedding | Semantic recall of previous specs / docs                | days-weeks |
| **S3 / GCS bucket**        | blob store       | Versioned prompt templates, backup schema snapshots     | —          |

---

## **5 · System Interaction (Mermaid)**

```
graph TD
    subgraph Frontend
        UI[Chat UI]
    end

    subgraph API
        Gateway[NestJS Controller]
    end

    subgraph Orchestrator
        Coord[CoordinatorAgent]
    end

    subgraph Understanding
        FieldU(FieldUnderstandingAgent)
        AppU(AppUnderstandingAgent)
        LayoutU(LayoutUnderstandingAgent)
        FlowU(FlowUnderstandingAgent)
    end

    subgraph Planning
        DBDesign(DBDesignAgent)
        TypeMap(TypeMapperAgent)
        AppPlan(AppDesignAgent)
        LayoutPlan(LayoutPlannerAgent)
        FlowPlan(FlowPlannerAgent)
    end

    subgraph Execution
        ObjExec(ObjectExecutorAgent)
        AppExec(AppExecutorAgent)
        LayoutExec(LayoutExecutorAgent)
        FlowExec(FlowExecutorAgent)
    end

    subgraph Assistance
        Conflict(ConflictResolutionAgent)
        HIL(HumanInLoopAgent)
    end

    UI --> Gateway
    Gateway --> Coord

    Coord -- "update_object" --> FieldU --> DBDesign
    DBDesign --> Conflict
    Conflict --resolved--> TypeMap --> ObjExec
    ObjExec --> HIL
    ObjExec -->|success| Gateway

    Coord -- "create_app" --> AppU --> AppPlan --> AppExec
    AppExec --> DBDesign & LayoutPlan & FlowPlan
    LayoutPlan --> LayoutExec
    FlowPlan --> FlowExec
    ObjExec & LayoutExec & FlowExec --> Gateway

    ObjExec --> Redis[(ContextMemory)]
    LayoutExec --> Redis
    FlowExec --> Redis
```

---

## **6 · Implementation Notes & Caveats**

1. **Prompt-to-JSON Contracts**
   - Define static JSON schemas (Zod/TypeBox) per UnderstandingAgent; set response_format:"json" in OpenAI calls.
   - Validate before passing to Planner to guarantee downstream safety.
2. **Token-Efficiency**
   - Never send full object catalog. Use ContextMemoryService.fetchObject(id) lazily inside agents.
   - Vector store only for semantic look-up, not for every turn.
3. **Retry & Idempotency**
   - ExecutorAgents wrap API calls with exponential back-off.
   - Store an idempotency_key (hash of spec) to prevent duplicate creates.
4. **Audit / Observability**
   - Log **every agent input & output** to Postgres (events table).
   - Attach trace_id per chat session.
5. **Security**
   - Sanitize user input, enforce field-name regex (^[a-zA-Z\_][a-zA-Z0-9_]\*$).
   - Avoid surfacing raw API errors — map to user-friendly messages.
6. **Human-in-the-Loop Flow**
   - HIL prompts pause LangGraph execution; store pending state in Redis with expiry.
   - Resume on user confirmation webhook → LangGraph resume API.
7. **Testing Strategy**
   - Unit-test each Planner/Executor with mock Nflow endpoints.
   - Integration tests: spin up local Redis + Postgres + Nflow staging sandbox.
8. **Versioning**
   - Version prompt templates and agent logic (SemVer).
   - Executor should attach X-Client-Version header to Nflow calls for traceability.
9. **Scale Considerations**
   - Stateless agents → horizontal scale via NestJS worker pool.
   - Redis clustering if concurrent sessions > 5 k.
10. **Future Extensibility**
    - New domain (e.g., “Permissions”) → add **PermissionUnderstanding/Planner/Executor** set; Coordinator routing grows but rest stays untouched.

---

### **🚦 Ready to Build**

This blueprint gives you **clear contracts, data flow, and separation of concerns**.

Implement agents as **NestJS injectable services**, plug them into **LangGraphJS nodes**, and connect with **Redis + pgvector + Postgres** for a production-grade multi-agent orchestration system.

Feel free to reference this document as the canonical architecture during implementation sprints.
