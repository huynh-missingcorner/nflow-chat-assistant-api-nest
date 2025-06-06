import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const AppDesignSchema = z.object({
  appId: z.string().describe('Generated unique application ID'),
  appName: z.string().describe('Validated and potentially modified application name'),
  description: z.string().describe('Enhanced description of the application'),
  objects: z.array(z.string()).describe('Validated list of objects with proper naming'),
  layouts: z.array(z.string()).describe('Generated layout specifications'),
  flows: z.array(z.string()).describe('Generated flow specifications'),
  dependencies: z.array(z.string()).optional().describe('Dependencies between components'),
  objectIds: z.array(z.string()).optional().describe('Generated object IDs'),
  layoutIds: z.array(z.string()).optional().describe('Generated layout IDs'),
  flowIds: z.array(z.string()).optional().describe('Generated flow IDs'),
  metadata: z.record(z.unknown()).optional().describe('Enhanced metadata and configuration'),
});

export type AppDesignInput = z.infer<typeof AppDesignSchema>;

const appDesignHandler = async (input: AppDesignInput): Promise<AppDesignInput> => {
  return Promise.resolve(input);
};

export const appDesignTool = tool(appDesignHandler, {
  name: 'app_design_enhancer',
  description: `
    Enhance and validate application specification with detailed design information.
    Generate:
    - Unique IDs for the application and its components
    - Validated naming conventions
    - Enhanced descriptions and specifications
    - Dependency mapping between components
    - Default configurations and metadata
    - Validation of component relationships
  `,
  schema: AppDesignSchema,
});

const AppValidationSchema = z.object({
  isValid: z.boolean().describe('Whether the application design is valid'),
  validationErrors: z.array(z.string()).optional().describe('List of validation errors if any'),
  warnings: z.array(z.string()).optional().describe('List of validation warnings'),
  suggestions: z.array(z.string()).optional().describe('Suggestions for improvement'),
});

type AppValidationInput = z.infer<typeof AppValidationSchema>;

const appValidationHandler = async (input: AppValidationInput): Promise<AppValidationInput> => {
  return Promise.resolve(input);
};

export const appValidationTool = tool(appValidationHandler, {
  name: 'app_validation_checker',
  description: `
    Validate application design for consistency and completeness.
    Check for:
    - Required fields and components
    - Naming convention compliance
    - Component dependency validation
    - Conflict detection with existing applications
  `,
  schema: AppValidationSchema,
});
