# 🤖 Intent Agent Examples

This document shows examples of the input (User prompt) and the output (JSON) of the Intent Agent. You as the Intent Agent should follow these examples for correct responses.

---

## 📥 Input Example 1: Simple Personal Finance App

**User Prompt:**

```
Build a personal finance app to track income and expenses.
```

**Expected Output from Intent Agent:**

```json
{
  "summary": "A personal finance app to manage income and expenses",
  "tasks": [
    {
      "id": "task-1",
      "agent": "ApplicationAgent",
      "description": "Create the Personal Finance app",
      "data": {
        "agentType": "application",
        "action": "create",
        "name": "Personal Finance",
        "description": "Track income and expenses",
        "visibility": "private",
        "slug": "personal-finance"
      }
    },
    {
      "id": "task-2",
      "agent": "ObjectAgent",
      "description": "Create objects for income and expense entries",
      "dependsOn": ["task-1"],
      "data": {
        "agentType": "object",
        "action": "create",
        "objects": [
          {
            "name": "Income",
            "description": "Track user income",
            "fields": null
          },
          {
            "name": "Expense",
            "description": "Track user expenses",
            "fields": null
          }
        ]
      }
    },
    {
      "id": "task-3",
      "agent": "LayoutAgent",
      "description": "Create pages for entering and viewing transactions",
      "dependsOn": ["task-2"],
      "data": {
        "agentType": "layout",
        "action": "create",
        "pages": ["Add Income", "Add Expense", "Transactions"]
      }
    },
    {
      "id": "task-4",
      "agent": "FlowAgent",
      "description": "Add a flow to notify when expense exceeds a threshold",
      "dependsOn": ["task-2"],
      "data": {
        "agentType": "flow",
        "action": "create",
        "trigger": "When add new income",
        "actionLogic": "Update the total income"
      }
    }
  ]
}
```

---

## 📥 Input Example 2: Simple CRM App

**User Prompt:**

```
Build a CRM system to manage contacts and leads.
```

**Expected Output from Intent Agent:**

```json
{
  "summary": "A CRM system for managing contacts and sales leads",
  "tasks": [
    {
      "id": "task-1",
      "agent": "ApplicationAgent",
      "description": "Create CRM app",
      "data": {
        "agentType": "application",
        "action": "create",
        "name": "CRM",
        "description": "Manage contacts and leads",
        "visibility": "private",
        "slug": "crm"
      }
    },
    {
      "id": "task-2",
      "agent": "ObjectAgent",
      "description": "Create Contact and Lead objects",
      "dependsOn": ["task-1"],
      "data": {
        "agentType": "object",
        "action": "create",
        "objects": [
          {
            "name": "Contact",
            "description": "Stores contact information",
            "fields": null
          },
          {
            "name": "Lead",
            "description": "Stores sales lead details",
            "fields": null
          }
        ]
      }
    },
    {
      "id": "task-3",
      "agent": "LayoutAgent",
      "description": "Create pages to view and add contacts/leads",
      "dependsOn": ["task-2"],
      "data": {
        "agentType": "layout",
        "action": "create",
        "pages": ["Contact List", "Lead List", "Add Contact", "Add Lead"]
      }
    },
    {
      "id": "task-4",
      "agent": "FlowAgent",
      "description": "Add flow to assign lead owner when created",
      "dependsOn": ["task-2"],
      "data": {
        "agentType": "flow",
        "action": "create",
        "trigger": "Lead created",
        "actionLogic": "Assign owner based on region"
      }
    }
  ]
}
```
