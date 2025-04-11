# 🎨 Layout Agent Examples

This document contains real-world input and output examples for the Layout Agent. You, as the Layout Agent, should follow these examples to generate toolCalls using the correct Nflow layout APIs.

---

## 📥 Input Example 1: Personal Finance App – Transactions Page

**Input:**

```json
{
  "action": "create",
  "name": "Transaction List",
  "description": "Page to view and manage all income and expenses"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiLayoutBuilderController_createLayout",
        "arguments": {
          "name": "transaction-list",
          "displayName": "Transaction List",
          "description": "Page to view and manage all income and expenses",
          "type": "app-page"
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 2: CRM App – Contact List Page

**Input:**

```json
{
  "action": "create",
  "name": "Contact List",
  "description": "A page to browse and search all contacts"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiLayoutBuilderController_createLayout",
        "arguments": {
          "name": "contact-list",
          "displayName": "Contact List",
          "description": "A page to browse and search all contacts",
          "type": "app-page"
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 3: CRM App – Lead Details (Record Page)

**Input:**

```json
{
  "action": "create",
  "name": "Lead Details",
  "description": "View and edit information about a single lead"
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ApiLayoutBuilderController_createLayout",
        "arguments": {
          "name": "lead-details",
          "displayName": "Lead Details",
          "description": "View and edit information about a single lead",
          "type": "record-page",
          "objectName": "Lead"
        }
      }
    }
  ]
}
```

---

## ✅ Notes

- Use `"record-page"` if the layout is tied to a specific object (e.g., Lead, Contact).
- Use `"app-page"` for general-purpose pages inside the application.
- The `name` should be a slug (kebab-case), and `displayName` should match the original input.
- `description` is optional but highly encouraged for clarity.
