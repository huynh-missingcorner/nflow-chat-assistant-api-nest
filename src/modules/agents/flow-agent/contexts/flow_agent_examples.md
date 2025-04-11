# 🔁 Flow Agent Examples

This document contains real-world input and output examples for the Flow Agent. You, as the Flow Agent, should follow these examples to generate toolCalls using the correct Nflow flow automation APIs.

---

## 📥 Input Example 1: Personal Finance App – Notify When Expense Is Added

**Input:**

```json
{
  "action": "create",
  "name": "Notify When Expense Added",
  "description": "Trigger a notification when a new expense is submitted"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiFlowBuilderController_createFlow",
        "arguments": {
          "name": "notify-when-expense-added",
          "displayName": "Notify When Expense Added",
          "description": "Trigger a notification when a new expense is submitted",
          "trigger": {
            "type": "onRecordCreate",
            "object": "Expense"
          },
          "flowItems": [
            {
              "type": "notification",
              "to": "record.owner",
              "message": "A new expense has been recorded."
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 2: CRM App – Assign Owner on Lead Creation

**Input:**

```json
{
  "action": "create",
  "name": "Assign Owner on Lead Creation",
  "description": "Automatically assign owner based on region when a lead is created"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiFlowBuilderController_createFlow",
        "arguments": {
          "name": "assign-lead-owner",
          "displayName": "Assign Owner on Lead Creation",
          "description": "Automatically assign owner based on region when a lead is created",
          "trigger": {
            "type": "onRecordCreate",
            "object": "Lead"
          },
          "flowItems": [
            {
              "type": "assignment",
              "field": "owner",
              "logic": "assign based on lead.region"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 3: CRM App – Redirect After Form Submission

**Input:**

```json
{
  "action": "create",
  "name": "Redirect After Contact Submission",
  "description": "Redirect to the dashboard after submitting contact form"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiFlowBuilderController_createFlow",
        "arguments": {
          "name": "redirect-after-contact-submit",
          "displayName": "Redirect After Contact Submission",
          "description": "Redirect to the dashboard after submitting contact form",
          "trigger": {
            "type": "onFormSubmit",
            "form": "AddContact"
          },
          "flowItems": [
            {
              "type": "redirect",
              "target": "dashboard"
            }
          ]
        }
      }
    }
  ]
}
```

---

## ✅ Notes

- Use `"onRecordCreate"` for automations triggered when a record is created.
- Use `"onFormSubmit"` for UI-based flows like submission redirects.
- The `name` should be a slug (kebab-case), and `displayName` should match the original input.
- Include flow logic under `flowItems` using simplified type and intent.
