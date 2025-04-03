# Nflow Chat Assistant - Technical Design Document

## 🏗 Project Overview
A multi-agent AI chatbot system that interprets user prompts and interacts with the Nflow no-code platform to generate applications.

---

## 📐 Software Architecture

### 🧱 Architecture Type
- **Modular Monolith**
- NestJS Modules organized under `modules/` directory for clear boundaries and scalability

### 🖼️ High-Level Flow
```
User Prompt -> Frontend (Next.js Chat UI) -> Backend (/chat API) -> Coordinator Agent ->
Step-by-step call to each Agent -> Return message + created app link -> Frontend displays response & iframe
```

### 🔁 Agent Interaction Flow
1. **User** sends prompt via `/chat`
2. **Coordinator Agent** receives and routes through:
   - Intent & Feature Extraction Agent
   - Component Mapping Agent
   - API Call Generator Agent
   - Validation & Debug Agent
   - Domain-specific Nflow Agents (Application, Object, Layout, Flow)
   - Nflow Execution Agent
3. **Coordinator Agent** compiles response + app link
4. Response returned to frontend + logged in history

---

## 📦 Key Features

### Frontend (Next.js)
- Persistent chat UI (chat history)
- Prompt input + enter to send
- Streamed or chunked responses
- Display iframe of generated app from Nflow

### Backend (NestJS)
- REST endpoint `/chat`
- Modular multi-agent system under `modules/`
- Stateless execution but stateful context management
- Persistent chat history (PostgreSQL)
- OpenAI integration (multiple models)
- Nflow API integration

---

## 🧱 Backend Code Structure (NestJS Modular Monolith)

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   └── dto/
│   │       └── chat-request.dto.ts
│   ├── coordinator/
│   │   └── coordinator.service.ts
│   ├── agents/
│   │   ├── intent/
│   │   │   ├── intent.module.ts
│   │   │   ├── intent.service.ts
│   │   │   └── context.md
│   │   ├── mapping/
│   │   │   ├── mapping.module.ts
│   │   │   ├── mapping.service.ts
│   │   │   └── context.md
│   │   ├── api-generator/
│   │   │   ├── api-generator.module.ts
│   │   │   ├── api-generator.service.ts
│   │   │   └── context.md
│   │   ├── validation/
│   │   │   ├── validation.module.ts
│   │   │   ├── validation.service.ts
│   │   │   └── context.md
│   │   ├── execution/
│   │   │   ├── execution.module.ts
│   │   │   ├── execution.service.ts
│   │   │   └── context.md
│   │   ├── application-agent/
│   │   │   ├── application.module.ts
│   │   │   ├── application.service.ts
│   │   │   └── context.md
│   │   ├── object-agent/
│   │   │   ├── object.module.ts
│   │   │   ├── object.service.ts
│   │   │   └── context.md
│   │   ├── layout-agent/
│   │   │   ├── layout.module.ts
│   │   │   ├── layout.service.ts
│   │   │   └── context.md
│   │   ├── flow-agent/
│   │   │   ├── flow.module.ts
│   │   │   ├── flow.service.ts
│   │   │   └── context.md
│   ├── nflow/
│   │   └── nflow.service.ts
│   ├── openai/
│   │   └── openai.service.ts
│   ├── history/
│   │   ├── history.module.ts
│   │   ├── history.service.ts
│   │   └── history.entity.ts
│   └── shared/
│       └── utils.ts
```

Each agent module can include tools, `context.md` for grounding, and model-specific configurations.

---

## 🧠 Agent Types

### General Workflow Agents
- Intent & Feature Extraction
- Component Mapping
- API Call Generator
- Validation & Debug
- Execution

### Nflow Domain Experts
Each expert agent focuses on specific Nflow API domains:
- **Application Agent**: Handles RESTful APIs for applications
- **Object Agent**: Handles database table structure (objects) and their APIs
- **Layout Agent**: Handles UI layout APIs
- **Flow Agent**: Manages visual workflows and user flow via APIs

---

## 🧰 Technology Stack

| Layer        | Stack                        |
|--------------|-------------------------------|
| Frontend     | Next.js, TailwindCSS         |
| Backend      | NestJS, TypeScript           |
| Database     | PostgreSQL + Prisma ORM      |
| API Calls    | `axios` or `httpx` (Nflow)   |
| OpenAI       | `openai` SDK                 |
| DevOps       | Docker, GitHub Actions       |

---

## 🔐 Security & Best Practices
- Rate limiting and abuse protection on `/chat`
- API key rotation and env management for OpenAI & Nflow
- Prisma validation for all data models
- Type-safe DTOs for every agent
- Modular services for future extensibility

---

## 🧪 Testing Strategy
- Unit test each agent with mock OpenAI responses
- Integration test coordinator flow
- E2E test: `/chat` with mocked Nflow API
- Seed DB with common chat scenarios

---

## 🗂 Future Enhancements
- Multi-model routing (e.g., use GPT-4 for Intent Agent, GPT-3.5 for Mapping)
- WebSocket streaming responses
- Agent memory using vector embeddings for long-term context
- User auth and project saving
- Admin panel for reviewing generated workflows

---

## ✅ Initial Endpoint: POST /chat

**Request Body**:
```json
{
  "sessionId": "abc123",
  "message": "Build a task manager app with login and calendar"
}
```

**Response**:
```json
{
  "reply": "✅ Your app is ready! Here's the link to view it in Nflow.",
  "appUrl": "https://nflow.so/app/xyz456"
}
```
