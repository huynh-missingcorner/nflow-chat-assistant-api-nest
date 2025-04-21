# Nflow data types instruction

Here is all supported data types of Nflow platform

## Text

Allows users to enter any combination of letters and numbers.

- Subtypes:
  - short: Best for title, name, links. It also able exact search on the field.
  - long: Best for description, biography. Exact search is disabled.
  - rich: Beast for text with formatting. Exact search is disabled.

Example for the `FieldController_changeField` tools

```json
{
  "objName": "product",
  "action": "create",
  "data": {
    "typeName": "text",
    "displayName": "Test Text",
    "name": "testText",
    "attributes": {
      "subType": "short"
    }
  },
  "updateLayouts": []
}
```

## Numeric

Allows users to enter any number. Leading zeros are removed.

- Subtypes:
  - integer: Best for Integer value, like count, age, amount, etc.
  - float: Best for Float value, like percentage, money, etc.

Example for `FieldController_changeField` tool:

```json
{
  "objName": "product",
  "action": "create",
  "data": {
    "typeName": "numeric",
    "displayName": "Test numeric",
    "name": "testNumeric",
    "attributes": {
      "subType": "integer"
    }
  },
  "updateLayouts": []
}
```

## Pick List

Allows users to select a value from a list you define.

- Subtypes:
  - single: Users can select only 1 option.
  - multiple: User can select multiple selections.

Example for `FieldController_changeField` tool:

```json
{
  "objName": "user",
  "action": "create",
  "data": {
    "typeName": "pickList",
    "displayName": "Gender",
    "name": "gender",
    "attributes": {
      "subType": "single"
    },
    "pickListId": "12_1245"
  },
  "updateLayouts": []
}
```

## Checkbox

Allows users to select a True (checked) or False (unchecked) value.

Example for `FieldController_changeField` tool:

```json
{
  "objName": "user",
  "action": "create",
  "data": {
    "typeName": "boolean",
    "displayName": "is Deleted",
    "name": "isDeleted",
    "attributes": {}
  },
  "updateLayouts": []
}
```

## Date Time

Allows users to enter a date and time, or pick a date from a popup calendar. When users click a date in the pop-up, that date and the current time are entered into the Date/Time field.

- Subtypes:
  - date-time
  - date
  - time

Example for `FieldController_changeField` tool:

```json
{
  "objName": "expense",
  "action": "create",
  "data": {
    "typeName": "dateTime",
    "displayName": "Spent At",
    "name": "spentAt",
    "attributes": {
      "subType": "date-time"
    }
  },
  "updateLayouts": []
}
```

## JSON

Allows users to input JSON objects

Example for `FieldController_changeField` tool:

```json
{
  "objName": "setting",
  "action": "create",
  "data": {
    "typeName": "json",
    "displayName": "config",
    "name": "config",
    "attributes": {}
  },
  "updateLayouts": []
}
```

## Relation

Creates a relationship that links this object to another object. The relationship field allows users to click on a lookup icon to select a value from a popup list. The other object is the source of the values in the list.

- value: Name of the target object

Example for `FieldController_changeField` tool:

```json
{
  "objName": "user",
  "action": "create",
  "data": {
    "typeName": "relation",
    "displayName": "Permission",
    "name": "permission",
    "value": "userPermission",
    "attributes": {
      "onDelete": "noAction",
      "filters": []
    }
  },
  "updateLayouts": []
}
```
