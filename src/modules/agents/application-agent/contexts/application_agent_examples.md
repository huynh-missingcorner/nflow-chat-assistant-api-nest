# 🧠 Application Agent Examples

This document shows real-world examples of input (task from Intent Agent) and the expected output (tool calls) of the Application Agent.

You, as the Application Agent, should follow these examples and generate toolCalls correctly based on the input `action`.

---

## 📥 Input Example 1: Create a Simple App

```json
{
  "action": "create",
  "name": "Personal Finance",
  "description": "Track income and expenses"
}
```

**Expected Output from Application Agent:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiAppBuilderController_createApp",
        "arguments": {
          "name": "personalFinance",
          "displayName": "Personal Finance",
          "description": "Track income and expenses"
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 2: Update an Existing App

```json
{
  "action": "update",
  "name": "crm",
  "description": "Updated CRM description"
}
```

**Expected Output from Application Agent:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiAppBuilderController_updateApp",
        "arguments": {
          "name": "crm",
          "displayName": "CRM",
          "description": "Updated CRM description"
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 3: Remove an App

```json
{
  "action": "remove",
  "name": "sales-dashboard",
  "description": "Outdated app"
}
```

**Expected Output from Application Agent:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiAppBuilderController_removeApps",
        "arguments": {
          "names": ["sales-dashboard"]
        }
      }
    }
  ]
}
```

---

## ✅ Notes

- Headers parameters like `x-nc-*` must be injected by the Execution Agent.
- `name` should be slugified for system use and must be unique, add a random number before the name if needed. For example: transform `financialManagement` to `financialManagement123`
- The Application Agent should only **plan** the tool calls — not execute them.
- If the action is `"recover"`, fallback or error until the Nflow platform adds support.
