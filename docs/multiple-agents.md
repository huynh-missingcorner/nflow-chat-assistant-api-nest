# 🤖 Nflow Chat Assistant – Agent Specification Document

This document provides a detailed overview of all agents used in the multi-agent system that powers the Nflow Chat Assistant. Each agent is an isolated module with a specific purpose in transforming natural language prompts into Nflow API actions.

---

## 🧠 1. Intent & Feature Extraction Agent

### Goal

Understand and extract the user's high-level intent and key features/components they want to build.

### Description

This agent acts as the first step in the AI pipeline. It receives raw user input and distills it into structured feature and component lists for downstream agents.

### Responsibilities

- Extract high-level goals from prompt
- Break down into individual features
- Identify required components and pages
- Summarize goals for other agents

### Input

- Natural language prompt (string)

### Output

```json
{
  "features": ["authentication", "dashboard", "calendar"],
  "components": ["login page", "dashboard page", "calendar widget"],
  "summary": "Build a task management app with login and scheduling"
}
```

---

## 🚀 2. Nflow Execution Agent

### Goal

Execute the API calls against the Nflow platform.

### Description

Final executor agent that sends requests to Nflow APIs, handles retries and logs the results.

### Responsibilities

- Send HTTP requests
- Retry on failure
- Return created resource IDs and links

### Input

- Validated API calls

### Output

```json
{
  "results": [{ "resource": "app", "id": "xyz123", "url": "https://nflow.so/app/xyz123" }]
}
```

---

## 🧠 3. Coordinator Agent (Main Orchestrator)

### Goal

Manage the interaction between agents to fulfill user requests.

### Description

The conductor that coordinates all agent executions and handles rerouting or retries based on results.

### Responsibilities

- Route input to agents in correct order
- Manage chat context
- Aggregate and return final response

### Input

- User message
- Chat session context

### Output

```json
{
  "reply": "Your app has been created!",
  "appUrl": "https://nflow.so/app/xyz123"
}
```

---

## 🧠 4. Application Agent

### Goal

Expert in handling application-related APIs on the Nflow platform.

### Description

Knows how to structure requests for creating, updating, and deleting applications.

### Responsibilities

- Prepare valid app payloads
- Suggest application layout & properties
- Collaborate with layout agent

### Input

- Intent or mappings involving application

### Output

- Application resource payloads or snippets

---

## 🧠 5. Object Agent

### Goal

Expert in designing and managing database objects (tables) in Nflow.

### Description

Understands best practices for schema design, relationships, indexing, and CRUD APIs.

### Responsibilities

- Generate object definitions
- Handle relationships and field types
- Map features to DB models

### Input

- Component mapping (requiring database)

### Output

- Object resource payloads (POST /v1/objects)

---

## 🧠 6. Layout Agent

### Goal

Expert in layout/UI representation in Nflow.

### Description

Helps translate structure and logic into page/section/widget configuration.

### Responsibilities

- Compose UI layout blocks
- Bind layout to data sources (objects)
- Define interactions

### Input

- Component list, layout type

### Output

- Layout payloads (POST /v1/layouts)

---

## 🧠 7. Flow Agent

### Goal

Expert in business logic/workflows inside Nflow (automation, form flows).

### Description

Defines task sequences, event triggers, and form logic to automate application behavior.

### Responsibilities

- Generate flow definitions
- Map triggers/actions to data
- Ensure logic consistency

### Input

- Workflow mapping or intent summary

### Output

- Flow payloads (POST /v1/flows)

---

Each agent lives under a dedicated NestJS module, with `service.ts`, optional `tools/`, and a `context.md` for grounding and prompt templates.
