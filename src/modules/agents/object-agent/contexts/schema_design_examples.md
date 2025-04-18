# Schema Design Examples

This document shows example inputs and expected schema designs for the Schema Design phase of the Object Agent.

---

## 📥 Example 1: Personal Finance App Objects

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

**Expected Schema Design:**

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
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "amount",
          "type": "numeric",
          "displayName": "Amount",
          "description": "Amount of money",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "date",
          "type": "dateTime",
          "displayName": "Date",
          "description": "Date of the income",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "notes",
          "type": "text",
          "displayName": "Notes",
          "description": "Additional notes",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
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
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "amount",
          "type": "numeric",
          "displayName": "Amount",
          "description": "Amount spent",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "date",
          "type": "dateTime",
          "displayName": "Date",
          "description": "Date of the expense",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "notes",
          "type": "text",
          "displayName": "Notes",
          "description": "Additional notes",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        }
      ],
      "relationships": null
    }
  ]
}
```

---

## 📥 Example 2: Task Management App

**Input:**

```json
{
  "agentType": "object",
  "action": "create",
  "objects": [
    {
      "name": "task",
      "description": "Tracks tasks and assignments.",
      "fields": null
    }
  ]
}
```

**Expected Schema Design:**

```json
{
  "schemas": [
    {
      "name": "Task",
      "displayName": "Task",
      "description": "Tracks tasks and assignments.",
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
          "name": "description",
          "type": "text",
          "displayName": "Description",
          "description": "Detailed task description",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "dueDate",
          "type": "dateTime",
          "displayName": "Due Date",
          "description": "When the task is due",
          "required": false,
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
        },
        {
          "name": "priority",
          "type": "text",
          "displayName": "Priority",
          "description": "Task priority level",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": "Medium",
            "validation": null
          }
        }
      ],
      "relationships": null
    }
  ]
}
```

---

## 📥 Example 3: CRM App with Relationships

**Input:**

```json
{
  "agentType": "object",
  "action": "create",
  "objects": [
    {
      "name": "contact",
      "description": "Stores contact information for people.",
      "fields": null
    },
    {
      "name": "company",
      "description": "Stores company information.",
      "fields": null
    }
  ]
}
```

**Expected Schema Design:**

```json
{
  "schemas": [
    {
      "name": "Contact",
      "displayName": "Contact",
      "description": "Stores contact information for people.",
      "primaryField": "name",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "displayName": "Name",
          "description": "Contact's full name",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "email",
          "type": "text",
          "displayName": "Email",
          "description": "Contact's email address",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": true,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "phone",
          "type": "text",
          "displayName": "Phone",
          "description": "Contact's phone number",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "address",
          "type": "text",
          "displayName": "Address",
          "description": "Contact's physical address",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        }
      ],
      "relationships": [
        {
          "type": "manyToOne",
          "targetObject": "Company",
          "fieldName": "company",
          "description": "Company this contact belongs to"
        }
      ]
    },
    {
      "name": "Company",
      "displayName": "Company",
      "description": "Stores company information.",
      "primaryField": "name",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "displayName": "Name",
          "description": "Company name",
          "required": true,
          "searchable": true,
          "attributes": {
            "isUnique": true,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "industry",
          "type": "text",
          "displayName": "Industry",
          "description": "Company industry",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        },
        {
          "name": "website",
          "type": "text",
          "displayName": "Website",
          "description": "Company website",
          "required": false,
          "searchable": true,
          "attributes": {
            "isUnique": false,
            "defaultValue": null,
            "validation": null
          }
        }
      ],
      "relationships": [
        {
          "type": "oneToMany",
          "targetObject": "Contact",
          "fieldName": "contacts",
          "description": "Contacts belonging to this company"
        }
      ]
    }
  ]
}
```

## ✅ Schema Design Best Practices

1. **Primary Field Selection**:

   - Choose the most user-identifiable field as primary
   - For people: "name" or "fullName"
   - For businesses: "name" or "companyName"
   - For documents: "title"
   - For transactions: "description" or category-related field

2. **Field Requirements**:

   - Mark identity fields as required
   - Mark crucial operational fields as required
   - Set searchable flag for fields users will likely search by

3. **Relationship Detection**:
   - Infer relationships between related objects
   - Determine relationship cardinality (one-to-many, etc.)
   - Set appropriate relationship description
