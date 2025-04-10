# 🤖 Intent Agent Examples

This document show some example of the input (User prompt) and the output (json) of the Intent Agent. You as the Intent Agent should follow these example for correct responses.

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
      "agent": "ApplicationAgent",
      "description": "Create the Personal Finance app",
      "data": {
        "action": "create",
        "name": "Personal Finance",
        "description": "Track income and expenses"
      }
    },
    {
      "agent": "ObjectAgent",
      "description": "Create objects for income and expense entries",
      "data": {
        "action": "create",
        "objects": ["Income", "Expense"]
      },
      "dependsOn": ["ApplicationAgent"]
    },
    {
      "agent": "LayoutAgent",
      "description": "Create pages for entering and viewing transactions",
      "data": {
        "action": "create",
        "pages": ["Add Income", "Add Expense", "Transactions"],
        "bindings": {
          "Income": "Transactions",
          "Expense": "Transactions"
        }
      },
      "dependsOn": ["ObjectAgent"]
    },
    {
      "agent": "FlowAgent",
      "description": "Add a flow to notify when expense exceeds a threshold",
      "data": {
        "action": "create",
        "trigger": "When add new income",
        "actionLogic": "Update the total income"
      },
      "dependsOn": ["LayoutAgent"]
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
      "agent": "ApplicationAgent",
      "description": "Create CRM app",
      "data": {
        "action": "create",
        "name": "CRM",
        "description": "Manage contacts and leads"
      }
    },
    {
      "agent": "ObjectAgent",
      "description": "Create Contact and Lead objects",
      "data": {
        "action": "create",
        "objects": [
          { "name": "Contact", "description": "Stores contact information" },
          { "name": "Lead", "description": "Stores sales lead details" }
        ]
      },
      "dependsOn": ["ApplicationAgent"]
    },
    {
      "agent": "LayoutAgent",
      "description": "Create pages to view and add contacts/leads",
      "data": {
        "action": "create",
        "pages": ["Contact List", "Lead List", "Add Contact", "Add Lead"],
        "bindings": {
          "Contact": "Contact List",
          "Lead": "Lead List"
        }
      },
      "dependsOn": ["ObjectAgent"]
    },
    {
      "agent": "FlowAgent",
      "description": "Add flow to assign lead owner when created",
      "data": {
        "action": "create",
        "trigger": "Lead created",
        "actionLogic": "Assign owner based on region"
      },
      "dependsOn": ["ObjectAgent"]
    }
  ]
}
```
