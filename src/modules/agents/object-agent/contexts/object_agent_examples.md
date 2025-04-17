# 🧠 Object Agent Examples

This document shows example inputs and expected outputs for the Object Agent. The Object Agent is responsible for translating object names into structured schemas and generating valid tool calls to the Nflow backend via `ObjectController_changeObject` and `FieldController_changeField`.

---

## ✅ Technical Notes

1. **Schema Design Process:**

   - First, the Object Agent uses `SchemaDesigner_designSchema` to infer the full schema
   - Then it creates tool calls for objects and fields

2. **Object Creation Tool:**

   - `ObjectController_changeObject` requires:
     - `action`: The operation to perform (create, update, delete, recover)
     - `name`: The name of the object
     - `data`: Object containing name, displayName, description, recordName, and owd

3. **Field Creation Tool:**

   - `FieldController_changeField` requires:
     - `action`: The operation to perform (create, update, delete, recover)
     - `objName`: The name of the object this field belongs to
     - `data`: Field definition with typeName, name, displayName, description, and attributes

4. **Field Types and SubTypes:**

   - `text` → subType: "short"
   - `numeric` → subType: "integer"
   - `dateTime` → subType: "date-time"
   - `boolean` → subType: null

5. **Record Name:**
   - Always set to the primary identifier field for the object
   - Type is typically "text"

---

## 📥 Example: Personal Finance App – Income & Expense

**Input:**

```json
{
  "agentType": "object",
  "action": "create",
  "objects": [
    {
      "name": "income",
      "description": "Records of all income transactions.",
      "fields": null
    },
    {
      "name": "expense",
      "description": "Records of all expense transactions.",
      "fields": null
    }
  ]
}
```

**Expected Output:**

```json
{
  "toolCalls": [
    {
      "functionName": "ObjectController_changeObject",
      "arguments": {
        "action": "create",
        "name": "income",
        "data": {
          "name": "income",
          "displayName": "Income",
          "description": "Tracks sources of income",
          "recordName": {
            "label": "source",
            "type": "text"
          },
          "owd": "Private"
        }
      }
    },
    {
      "functionName": "ObjectController_changeObject",
      "arguments": {
        "action": "create",
        "name": "expense",
        "data": {
          "name": "expense",
          "displayName": "Expense",
          "description": "Tracks where money was spent",
          "recordName": {
            "label": "category",
            "type": "text"
          },
          "owd": "Private"
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "income",
        "data": {
          "typeName": "text",
          "name": "source",
          "displayName": "Source",
          "description": "Source of income",
          "attributes": {
            "subType": "short"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "income",
        "data": {
          "typeName": "numeric",
          "name": "amount",
          "displayName": "Amount",
          "description": "Amount of money",
          "attributes": {
            "subType": "integer"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "income",
        "data": {
          "typeName": "dateTime",
          "name": "date",
          "displayName": "Date",
          "description": "Date of the income",
          "attributes": {
            "subType": "date-time"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "income",
        "data": {
          "typeName": "text",
          "name": "notes",
          "displayName": "Notes",
          "description": "Additional notes",
          "attributes": {
            "subType": "short"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "expense",
        "data": {
          "typeName": "text",
          "name": "category",
          "displayName": "Category",
          "description": "Expense category",
          "attributes": {
            "subType": "short"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "expense",
        "data": {
          "typeName": "numeric",
          "name": "amount",
          "displayName": "Amount",
          "description": "Amount spent",
          "attributes": {
            "subType": "integer"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "expense",
        "data": {
          "typeName": "dateTime",
          "name": "date",
          "displayName": "Date",
          "description": "Date of the expense",
          "attributes": {
            "subType": "date-time"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "create",
        "objName": "expense",
        "data": {
          "typeName": "text",
          "name": "notes",
          "displayName": "Notes",
          "description": "Additional notes",
          "attributes": {
            "subType": "short"
          }
        }
      }
    }
  ]
}
```
