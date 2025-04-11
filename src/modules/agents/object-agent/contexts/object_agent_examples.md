# 🧠 Object Agent Examples

This document shows example inputs and expected JSON outputs for the Object Agent. The Object Agent is responsible for translating object names into structured schema and generating valid tool calls to the Nflow backend via `ObjectController_changeObject` and `FieldController_changeField`.

---

## 📥 Input Example 1: Personal Finance App – Income & Expense

**Input:**

```json
{
  "action": "create",
  "objects": ["Income", "Expense"]
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ObjectController_changeObject",
        "arguments": {
          "action": "create",
          "name": "Income",
          "data": {
            "name": "Income",
            "displayName": "Income",
            "recordName": {
              "label": "source",
              "type": "text"
            },
            "owd": "Private",
            "description": "Tracks sources of income"
          }
        }
      }
    },
    {
      "order": 2,
      "toolCall": {
        "functionName": "ObjectController_changeObject",
        "arguments": {
          "action": "create",
          "name": "Expense",
          "data": {
            "name": "Expense",
            "displayName": "Expense",
            "recordName": {
              "label": "category",
              "type": "text"
            },
            "owd": "Private",
            "description": "Tracks where money was spent"
          }
        }
      }
    },
    {
      "order": 3,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Income",
          "data": {
            "typeName": "text",
            "name": "title",
            "displayName": "Title",
            "description": "Income title",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    },
    {
      "order": 4,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Income",
          "data": {
            "typeName": "numeric",
            "name": "amount",
            "displayName": "Amount",
            "description": "Amount of money",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    },
    {
      "order": 5,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Income",
          "data": {
            "typeName": "dateTime",
            "name": "createdAt",
            "displayName": "created At",
            "description": "Created Date of the Income",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    },
    {
      "order": 6,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Expense",
          "data": {
            "typeName": "text",
            "name": "title",
            "displayName": "Title",
            "description": "Expense title",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    },
    {
      "order": 7,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Expense",
          "data": {
            "typeName": "numeric",
            "name": "amount",
            "displayName": "Amount",
            "description": "Amount of money",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    },
    {
      "order": 8,
      "toolCall": {
        "functionName": "FieldController_changeField",
        "arguments": {
          "action": "create",
          "objName": "Expense",
          "data": {
            "typeName": "dateTime",
            "name": "createdAt",
            "displayName": "created At",
            "description": "Created Date of the Expense",
            "attributes": {
              "isRequired": true,
              "isSearchable": true
            }
          }
        }
      }
    }
  ]
}
```

---

## 📥 Input Example 2: CRM System – Contact & Lead

**Input:**

```json
{
  "action": "create",
  "objects": ["Contact", "Lead"]
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "order": 1,
      "toolCall": {
        "functionName": "ObjectController_changeObject",
        "arguments": {
          "action": "create",
          "name": "Contact",
          "data": {
            "name": "Contact",
            "displayName": "Contact",
            "recordName": {
              "label": "name",
              "type": "text"
            },
            "owd": "PublicRead",
            "description": "Stores personal contact information"
          },
          "x-nc-lang": "en",
          "x-nc-tenant": "example-org",
          "x-nc-date": "2024-01-01T12:00:00Z",
          "x-nc-payload": "base64-encoded",
          "x-nc-digest": "SHA-256=...",
          "x-nc-signature": "..."
        }
      }
    },
    {
      "order": 2,
      "toolCall": {
        "functionName": "ObjectController_changeObject",
        "arguments": {
          "action": "create",
          "name": "Lead",
          "data": {
            "name": "Lead",
            "displayName": "Lead",
            "recordName": {
              "label": "company",
              "type": "text"
            },
            "owd": "PublicRead",
            "description": "Stores sales leads and contact points"
          },
          "x-nc-lang": "en",
          "x-nc-tenant": "example-org",
          "x-nc-date": "2024-01-01T12:00:00Z",
          "x-nc-payload": "base64-encoded",
          "x-nc-digest": "SHA-256=...",
          "x-nc-signature": "..."
        }
      }
    }
  ]
}
```

---

## ✅ Notes

- `name` should be slugified for system use and must be unique, add a random number before the name if needed. For example: transform `income` to `income123`
- `recordName.label` is typically the primary identifier field (e.g. `"name"`, `"title"`, `"category"`)
- `owd` (object-level sharing setting) should default to `"PublicRead"` unless otherwise stated.
- Headers (`x-nc-*`) should be filled by the Execution Agent.
- The Object Agent only plans toolCalls and never executes them.
