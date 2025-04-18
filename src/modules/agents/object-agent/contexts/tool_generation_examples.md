# Tool Generation Examples

This document shows example inputs and expected tool call outputs for the Tool Generation phase of the Object Agent.

---

## 📥 Example 1: Task Management App

**Input Schema:**

```json
{
  "schemas": [
    {
      "name": "Task",
      "displayName": "Task",
      "description": "Tracks tasks and their completion status",
      "primaryField": "title",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "displayName": "Title",
          "description": "Task title",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "isCompleted",
          "type": "boolean",
          "displayName": "Is Completed",
          "description": "Whether the task is completed",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": false,
            "validation": null
          }
        }
      ]
    }
  ]
}
```

**Expected Tool Calls:**

```json
{
  "toolCalls": [
    {
      "functionName": "ObjectController_changeObject",
      "arguments": {
        "action": "create",
        "name": "task",
        "data": {
          "name": "task",
          "displayName": "Task",
          "description": "Tracks tasks and their completion status",
          "recordName": {
            "label": "title",
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
        "objName": "task",
        "data": {
          "typeName": "text",
          "name": "title",
          "displayName": "Title",
          "description": "Task title",
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
        "objName": "task",
        "data": {
          "typeName": "boolean",
          "name": "isCompleted",
          "displayName": "Is Completed",
          "description": "Whether the task is completed",
          "attributes": {
            "subType": null
          }
        }
      }
    }
  ]
}
```

---

## 📥 Example 2: Personal Finance App

**Input Schema:**

```json
{
  "schemas": [
    {
      "name": "Income",
      "displayName": "Income",
      "description": "Records of all income transactions.",
      "primaryField": "source",
      "fields": [
        {
          "name": "source",
          "type": "text",
          "displayName": "Source",
          "description": "Source of income",
          "required": true,
          "searchable": true,
          "attributes": {}
        },
        {
          "name": "amount",
          "type": "numeric",
          "displayName": "Amount",
          "description": "Amount of money",
          "required": true,
          "searchable": true,
          "attributes": {}
        },
        {
          "name": "date",
          "type": "dateTime",
          "displayName": "Date",
          "description": "Date of the income",
          "required": true,
          "searchable": true,
          "attributes": {}
        }
      ],
      "relationships": null
    },
    {
      "name": "Expense",
      "displayName": "Expense",
      "description": "Records of all expense transactions.",
      "primaryField": "category",
      "fields": [
        {
          "name": "category",
          "type": "text",
          "displayName": "Category",
          "description": "Expense category",
          "required": true,
          "searchable": true,
          "attributes": {}
        },
        {
          "name": "amount",
          "type": "numeric",
          "displayName": "Amount",
          "description": "Amount spent",
          "required": true,
          "searchable": true,
          "attributes": {}
        },
        {
          "name": "date",
          "type": "dateTime",
          "displayName": "Date",
          "description": "Date of the expense",
          "required": true,
          "searchable": true,
          "attributes": {}
        }
      ],
      "relationships": null
    }
  ]
}
```

**Expected Tool Calls:**

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
          "description": "Records of all income transactions.",
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
          "description": "Records of all expense transactions.",
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
    }
  ]
}
```

---

## 📥 Example 3: Update Operation

**Input Schema:**

```json
{
  "schemas": [
    {
      "name": "Contact",
      "displayName": "Contact",
      "description": "Updated contact information for people.",
      "primaryField": "name",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "displayName": "Full Name",
          "description": "Contact's full name",
          "required": true,
          "searchable": true,
          "attributes": {}
        },
        {
          "name": "email",
          "type": "text",
          "displayName": "Email Address",
          "description": "Contact's email address",
          "required": false,
          "searchable": true,
          "attributes": {}
        }
      ]
    }
  ]
}
```

**Action: update**

**Expected Tool Calls:**

```json
{
  "toolCalls": [
    {
      "functionName": "ObjectController_changeObject",
      "arguments": {
        "action": "update",
        "name": "contact",
        "data": {
          "name": "contact",
          "displayName": "Contact",
          "description": "Updated contact information for people.",
          "recordName": {
            "label": "name",
            "type": "text"
          },
          "owd": "Private"
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "update",
        "objName": "contact",
        "data": {
          "typeName": "text",
          "name": "name",
          "displayName": "Full Name",
          "description": "Contact's full name",
          "attributes": {
            "subType": "short"
          }
        }
      }
    },
    {
      "functionName": "FieldController_changeField",
      "arguments": {
        "action": "update",
        "objName": "contact",
        "data": {
          "typeName": "text",
          "name": "email",
          "displayName": "Email Address",
          "description": "Contact's email address",
          "attributes": {
            "subType": "short"
          }
        }
      }
    }
  ]
}
```

---

## 📥 Example 4: Delete Operation

**Input Schema:**

```json
{
  "schemas": [
    {
      "name": "Task",
      "displayName": "Task",
      "description": "Task that needs to be deleted",
      "primaryField": "title",
      "fields": []
    }
  ]
}
```

**Action: delete**

**Expected Tool Calls:**

```json
{
  "toolCalls": [
    {
      "functionName": "ObjectController_changeObject",
      "arguments": {
        "action": "delete",
        "name": "task",
        "data": {
          "name": "task",
          "displayName": "Task",
          "description": "Task that needs to be deleted",
          "recordName": {
            "label": "title",
            "type": "text"
          },
          "owd": "Private"
        }
      }
    }
  ]
}
```

## ✅ Tool Generation Patterns

1. **Object Creation Flow**:

   - Always generate object creation tools first
   - Then generate field creation tools
   - Use lowercase for object and field names in tool calls

2. **Type Mapping Examples**:

   - Text field:
     ```json
     {
       "typeName": "text",
       "attributes": { "subType": "short" }
     }
     ```
   - Numeric field:
     ```json
     {
       "typeName": "numeric",
       "attributes": { "subType": "integer" }
     }
     ```
   - Date/time field:
     ```json
     {
       "typeName": "dateTime",
       "attributes": { "subType": "date-time" }
     }
     ```
   - Boolean field:
     ```json
     {
       "typeName": "boolean",
       "attributes": { "subType": null }
     }
     ```

3. **OWD (Object-Wide Default) Settings**:
   - Most objects use "Private"
   - Public-facing objects use "PublicRead"
   - Collaborative objects use "PublicReadWrite"
