# 🤖 Nflow Chat Assistant – Agent List Overview

Each agent handles a specific step in transforming natural language into structured Nflow API actions.

---

1. 🧠 **Intent & Feature Extraction Agent**
   - **Goal**: Understand what the user wants to build
   - **Inputs**:
     - Natural language prompt (e.g. “Build me a blog with a contact form”)
   - **Outputs**:
     - Feature list
     - Component list (pages, sections, etc.)
     - Workflow summary for next agents
   - ✅ Crucial for mapping user intent to Nflow capabilities

---

2. 🧩 **Component Mapping Agent**
   - **Goal**: Map extracted features to Nflow-compatible resources and workflows
   - **Inputs**:
     - Feature list and components from Intent Agent
   - **Outputs**:
     - Mapping of each feature to a Nflow resource (e.g. blog → data resource, contact → workflow)
     - Initial schema suggestions (if applicable)
   - ✅ Translates business intent into Nflow-native structures

---

3. ⚙️ **API Call Generator Agent**
   - **Goal**: Generate valid Nflow API requests
   - **Inputs**:
     - Mapped components/resources from the Mapping Agent
   - **Outputs**:
     - JSON-ready API call payloads for Nflow
     - Endpoint sequence for execution (ordered list)
   - ✅ Core engine to transform structure into action

---

4. ✅ **Validation & Debug Agent**
   - **Goal**: Review generated API requests for accuracy, completeness, and consistency
   - **Inputs**:
     - API payloads from the API Generator Agent
   - **Outputs**:
     - List of validation issues (if any)
     - Suggestions for correction
     - Confidence score or warning level
   - ✅ Improves reliability and reduces failed requests

---

5. 🚀 **Nflow Execution Agent**
   - **Goal**: Execute the actual API requests to the Nflow platform
   - **Inputs**:
     - Prepared API call payloads from the API Call Generator Agent
   - **Outputs**:
     - Nflow responses (resource created, errors, IDs, etc.)
     - Execution summary/log
   - ✅ This is the agent that sends HTTP requests to Nflow’s external API using httpx, requests, or any async client

---

6. 🧠 **Coordinator Agent (Main Chat Orchestrator)**
   - **Goal**: Manage execution flow between all agents
   - **Inputs**:
     - User prompt and ongoing context
   - **Outputs**:
     - Final response or Nflow execution plan
     - Error handling or rerouting to specific agents if needed
   - ✅ Keeps all agents working as a cohesive pipeline
