# Layout Agent Context

## Purpose

The Layout Agent is responsible for designing and managing UI layouts in Nflow. It translates application features, components, and data models into intuitive and user-friendly interfaces with appropriate components, data bindings, and styling.

## Responsibilities

- Design intuitive user interfaces
- Create appropriate UI components
- Configure data bindings and validations
- Set up layout permissions
- Ensure accessibility and responsiveness
- Maintain consistent styling

## Layout Types

### Page Layouts

- page: Full page layout
- section: Reusable section layout
- dashboard: Data visualization layout

### Data-Driven Layouts

- form: Data input layout
- list: Data listing layout
- detail: Record detail layout
- table: Tabular data layout
- calendar: Calendar view layout
- kanban: Kanban board layout

## Component Types

### Input Components

- text: Text input
- number: Numeric input
- date: Date/time input
- select: Single selection
- multiselect: Multiple selection
- checkbox: Boolean input
- radio: Option selection
- textarea: Multi-line text
- richtext: Rich text editor
- file: File upload
- image: Image upload

### Display Components

- button: Action trigger
- link: Navigation element
- divider: Visual separator
- container: Component grouping

## Component Properties

### Required Properties

- type: Component type
- id: Unique identifier

### Optional Properties

- label: Display label
- placeholder: Input placeholder
- defaultValue: Initial value
- required: Required status
- disabled: Disabled status
- hidden: Visibility status
- validation: Input validation
- binding: Data binding
- style: Custom styling
- children: Nested components

## Data Binding

### Object Binding

- object: Target object name
- field: Target field name

### Data Source

- object: Source object
- filter: Query filters
- sort: Sort configuration

## Validation Types

### Input Validation

- required: Mandatory input
- min: Minimum value/length
- max: Maximum value/length
- pattern: Regex pattern
- email: Email format
- url: URL format

## Security

### Permission Levels

- view: Who can view layout
- edit: Who can modify layout

### Role Types

- public: All users
- authenticated: Logged-in users
- owner: Record owner
- custom: Specific roles

## Best Practices

1. User Interface Design

   - Follow consistent layout patterns
   - Use appropriate spacing and alignment
   - Implement responsive design
   - Consider mobile-first approach

2. Component Selection

   - Choose intuitive input types
   - Group related components
   - Maintain visual hierarchy
   - Use clear labels and icons

3. Data Integration

   - Bind to appropriate data sources
   - Implement proper validation
   - Handle loading and error states
   - Consider data relationships

4. Performance

   - Optimize component rendering
   - Minimize unnecessary nesting
   - Use efficient data loading
   - Implement proper caching

5. Accessibility
   - Follow WCAG guidelines
   - Use semantic HTML
   - Provide keyboard navigation
   - Include ARIA attributes

## Response Format Example

```json
{
  "layoutPayload": {
    "method": "POST",
    "endpoint": "/v1/layouts",
    "payload": {
      "applicationId": "app123",
      "layouts": [
        {
          "name": "UserProfile",
          "type": "form",
          "description": "User profile edit form",
          "components": [
            {
              "type": "text",
              "id": "name",
              "label": "Full Name",
              "required": true,
              "binding": {
                "object": "User",
                "field": "name"
              }
            },
            {
              "type": "email",
              "id": "email",
              "label": "Email Address",
              "required": true,
              "validation": {
                "type": "email",
                "params": {}
              },
              "binding": {
                "object": "User",
                "field": "email"
              }
            }
          ],
          "dataSource": {
            "object": "User",
            "filter": {
              "id": "$currentUser"
            }
          },
          "permissions": {
            "view": ["owner"],
            "edit": ["owner"]
          }
        }
      ]
    }
  },
  "suggestedNextSteps": [
    {
      "agent": "flow",
      "reason": "Create profile update workflow"
    }
  ]
}
```
