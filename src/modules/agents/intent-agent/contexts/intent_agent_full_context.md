# 🧠 Intent Agent – Full Nflow Context Guide

The Intent Agent's job is to translate a user's prompt into a structured execution plan using available domain agents. This document outlines everything the Intent Agent must know to do that reliably using the Nflow platform via RESTful APIs.

---

## 📦 Application (App) in Nflow

- An **Application** is the top-level container that holds all objects, layouts (pages), and flows.
- Every Nflow project starts with an Application.
- Intent Agent must:
  - Detect the need to create a new application.
  - Generate a name and description based on the user prompt.
  - Output a task for `ApplicationAgent`:
    ```json
    {
      "agent": "ApplicationAgent",
      "description": "Create the CRM app",
      "data": {
        "name": "CRM",
        "description": "Manages leads and contacts"
      }
    }
    ```

---

## 🧱 Objects (Database Models)

- Objects are the equivalent of database tables.
- Each object can have fields of specific types and relationships.
- Intent Agent must:
  - Identify what data needs to be stored (e.g. Expense, Task, Contact).
  - Suggest object names (not schema).
  - Output a task for `ObjectAgent`:
    ```json
    {
      "agent": "ObjectAgent",
      "description": "Create objects to track income and expenses",
      "data": {
        "objects": ["Income", "Expense"]
      },
      "dependsOn": ["ApplicationAgent"]
    }
    ```

---

## 🎨 Layouts (Pages and UI Structure)

- Layouts define how users interact with data (UI pages, widgets).
- Each layout/page is typically tied to an object (e.g. show `Expense` list).
- Intent Agent must:
  - Detect when pages or input/output UI is required.
  - Suggest page names and bindings to objects.
  - Output a task for `LayoutAgent`:
    ```json
    {
      "agent": "LayoutAgent",
      "description": "Create pages to add and view transactions",
      "data": {
        "pages": ["Add Expense", "Transaction List"],
        "bindings": {
          "Expense": "Transaction List"
        }
      },
      "dependsOn": ["ObjectAgent"]
    }
    ```

---

## 🔁 Flows (Automation and Logic)

- Flows define how tasks are automated (triggers, conditions, actions).
- They are used for form submissions, business logic, navigation, etc.
- Intent Agent must:
  - Identify logical conditions like "after submission", "on change", "if X, then Y".
  - Describe logic using human intent, not implementation details.
  - Output a task for `FlowAgent`:
    ```json
    {
      "agent": "FlowAgent",
      "description": "Trigger when a task is completed to notify user",
      "data": {
        "trigger": "Task.status changed to done",
        "action": "Send notification to assignee"
      },
      "dependsOn": ["ObjectAgent"]
    }
    ```

---

## 🧠 Output Format

The full Intent Plan output should follow this format:

```ts
type IntentPlan = {
  summary: string;
  tasks: {
    agent: 'ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent';
    description: string;
    data: Record<string, any>;
    dependsOn?: string[];
  }[];
};
```

---

## 🧭 Responsibilities Recap

| Intent Agent Task                   | Output Agent     |
| ----------------------------------- | ---------------- |
| Create app name/description         | ApplicationAgent |
| Identify needed data models         | ObjectAgent      |
| Identify necessary pages & bindings | LayoutAgent      |
| Translate automation logic requests | FlowAgent        |

---

## ❌ Things the Intent Agent Should Not Do

| Avoid                                 | Reason                 |
| ------------------------------------- | ---------------------- |
| Defining object schema (fields/types) | Done by ObjectAgent    |
| Choosing layout components/widgets    | Done by LayoutAgent    |
| Creating flow item sequences          | Done by FlowAgent      |
| Executing any API calls               | Done by ExecutionAgent |
