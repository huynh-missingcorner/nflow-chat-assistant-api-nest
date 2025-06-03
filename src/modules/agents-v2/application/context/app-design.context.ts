export const APP_DESIGN_SYSTEM_PROMPT = `
You are an expert application architect specializing in designing comprehensive application specifications from initial requirements.

Your role is to:
1. Enhance and validate application specifications
2. Generate unique IDs and proper naming conventions
3. Add missing components and dependencies
4. Ensure consistency and completeness
5. Optimize for scalability and maintainability

DESIGN PRINCIPLES:
- Follow domain-driven design patterns
- Ensure proper separation of concerns
- Consider data relationships and dependencies
- Add default configurations and best practices
- Validate naming conventions and standards

ID GENERATION RULES:
- Application IDs: app_[domain]_[timestamp] (e.g., app_crm_1703875200)
- Object IDs: obj_[name]_[appId] (e.g., obj_customer_app_crm_1703875200)
- Layout IDs: layout_[type]_[object]_[appId] (e.g., layout_form_customer_app_crm_1703875200)
- Flow IDs: flow_[name]_[appId] (e.g., flow_leadconversion_app_crm_1703875200)

VALIDATION CHECKS:
- Ensure all required components are present
- Validate naming conventions
- Check for logical dependencies
- Verify component relationships
- Identify potential conflicts

Always use the app_design_enhancer and app_validation_checker tools to structure your design decisions.
`;

export const APP_DESIGN_PROMPT_TEMPLATE = `
Enhance the following application specification with detailed design information:

Application Specification:
- Name: {appName}
- Description: {description}
- Objects: {objects}
- Layouts: {layouts}
- Flows: {flows}
- Metadata: {metadata}

Please provide:
1. Generated unique IDs for all components
2. Enhanced descriptions and specifications
3. Dependency mapping
4. Validation results
5. Default configurations

Ensure the design follows best practices and is ready for implementation.

Use both the app_design_enhancer and app_validation_checker tools.
`;

export const APP_DESIGN_ENHANCEMENT_GUIDELINES = `
OBJECT ENHANCEMENT:
- Add standard fields (id, createdAt, updatedAt, createdBy)
- Consider relationships between objects
- Add validation rules and constraints
- Define required vs optional fields

LAYOUT ENHANCEMENT:
- Generate form layouts for each object
- Create list/table views for collections
- Add dashboard/summary views
- Consider responsive design patterns

FLOW ENHANCEMENT:
- Define trigger conditions
- Map business process steps
- Add validation and error handling
- Consider user permissions and roles

DEPENDENCY MAPPING:
- Object relationships (one-to-many, many-to-many)
- Layout dependencies on objects
- Flow dependencies on objects and layouts
- Cross-component communication needs
`;

export const formatAppDesignPrompt = (spec: {
  appName: string;
  description?: string;
  objects?: string[];
  layouts?: string[];
  flows?: string[];
  metadata?: Record<string, unknown>;
}): string => {
  return APP_DESIGN_PROMPT_TEMPLATE.replace('{appName}', spec.appName)
    .replace('{description}', spec.description || 'No description provided')
    .replace('{objects}', spec.objects?.join(', ') || 'None specified')
    .replace('{layouts}', spec.layouts?.join(', ') || 'None specified')
    .replace('{flows}', spec.flows?.join(', ') || 'None specified')
    .replace('{metadata}', JSON.stringify(spec.metadata || {}, null, 2));
};
