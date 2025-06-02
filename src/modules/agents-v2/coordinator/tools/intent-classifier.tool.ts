import { tool } from '@langchain/core/tools';
import z from 'zod';

// ------------ ENUMS ------------
export const DomainEnum = z.enum(['application', 'object', 'layout', 'flow']);

export const IntentEnum = z.enum([
  // Application
  'create_application',
  'delete_application',
  'update_application',
  // Object
  'create_object',
  'delete_object',
  'update_object_metadata',
  'manipulate_object_fields',
  'design_data_schema',
  // Layout
  'create_layout',
  'delete_layout',
  'update_layout',
  // Flow
  'create_flow',
  'delete_flow',
  'update_flow',
]);

// Single intent schema
const IntentSchema = z.object({
  domain: DomainEnum.describe('The domain of the user request, such as application or object'),
  intent: IntentEnum.describe('The specific action the user wants to perform in this domain'),
  target: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'The name or names of the application(s), object(s), flow(s), layout(s) the intent applies to',
    ),
  details: z
    .any()
    .optional()
    .describe(
      'Details of the intent, list everything you need that will help the worker agent get the tasks done.',
    ),
  priority: z
    .number()
    .min(1)
    .optional()
    .describe(
      'Priority of this intent (1 is highest). If not specified, intents are processed in the order they are listed.',
    ),
});

// Schema supporting multiple intents
const IntentClassifierSchema = z.object({
  intents: z.array(IntentSchema).describe('Array of intents identified in the user request'),
  dependencies: z
    .array(
      z.object({
        dependentIntentIndex: z
          .number()
          .describe('Index of the dependent intent in the intents array'),
        dependsOnIntentIndex: z.number().describe('Index of the intent this intent depends on'),
        reason: z.string().describe('Reason for the dependency'),
      }),
    )
    .optional()
    .describe('Dependencies between intents, if any exist'),
});

export type IntentSchema = z.infer<typeof IntentSchema>;
export type IntentClassifierOutput = z.infer<typeof IntentClassifierSchema>;

const intentClassifierHandler = async (
  input: IntentClassifierOutput,
): Promise<IntentClassifierOutput> => {
  return new Promise((resolve) => {
    console.log('IntentClassifierTool - input', input);
    resolve(input);
  });
};

export const IntentClassifierTool = tool(intentClassifierHandler, {
  name: 'IntentClassifierTool',
  description:
    'Classifies the user intent from the natural language prompt, identifying all intents present. Can handle multiple tasks in a single prompt, including dependencies between tasks. For each intent, identify domain, intent type, target, and details.',
  schema: IntentClassifierSchema,
});
