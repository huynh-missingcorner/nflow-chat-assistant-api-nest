import { tool } from '@langchain/core/tools';
import z from 'zod';

// ------------ PARAM SCHEMAS ------------

const CreateApplicationParams = z.object({
  displayName: z.string(),
  description: z.string().optional(),
});

const DeleteApplicationParams = z.object({
  applicationNames: z.array(z.string()),
});

const UpdateApplicationParams = z.object({
  applicationName: z.string(),
  newDisplayName: z.string().optional(),
  newDescription: z.string().optional(),
});

const CreateObjectParams = z.object({
  objects: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
});

const DeleteObjectParams = z.object({
  objectNames: z.array(z.string()),
});

const UpdateObjectMetadataParams = z.object({
  updates: z.array(
    z.object({
      objectName: z.string(),
      newDisplayName: z.string().optional(),
      newDescription: z.string().optional(),
    }),
  ),
});

const ManipulateFieldsParams = z.object({
  actions: z.array(
    z.object({
      objectName: z.string(),
      addFields: z
        .array(
          z.object({
            name: z.string(),
            displayName: z.string().optional(),
            dataType: z.string(),
            isRequired: z.boolean().optional(),
            description: z.string().optional(),
          }),
        )
        .optional(),
      removeFields: z.array(z.string()).optional(),
      updateFields: z
        .array(
          z.object({
            name: z.string(),
            newDataType: z.string().optional(),
            newDisplayName: z.string().optional(),
            newDescription: z.string().optional(),
          }),
        )
        .optional(),
    }),
  ),
});

const DesignDataSchemaParams = z.object({
  appName: z.string().optional(),
  promptSummary: z.string(),
});

const CreateLayoutParams = z.object({
  layoutName: z.string(),
  layoutType: z.string(),
  layoutDescription: z.string().optional(),
});

const DeleteLayoutParams = z.object({
  layoutNames: z.array(z.string()),
});

const UpdateLayoutParams = z.object({
  layoutName: z.string(),
  newLayoutName: z.string().optional(),
  newLayoutDescription: z.string().optional(),
});

const CreateFlowParams = z.object({
  flowName: z.string(),
  flowDescription: z.string().optional(),
});

const DeleteFlowParams = z.object({
  flowNames: z.array(z.string()),
});

const UpdateFlowParams = z.object({
  flowName: z.string(),
  newFlowName: z.string().optional(),
  newFlowDescription: z.string().optional(),
});

// ------------ TOOL ------------

const ParamExtractorSchema = z.discriminatedUnion('intent', [
  z.object({
    domain: z.literal('application'),
    intent: z.literal('create_application'),
    target: z.string().optional(),
    params: CreateApplicationParams,
  }),
  z.object({
    domain: z.literal('application'),
    intent: z.literal('delete_application'),
    target: z.string().optional(),
    params: DeleteApplicationParams,
  }),
  z.object({
    domain: z.literal('application'),
    intent: z.literal('update_application'),
    target: z.string().optional(),
    params: UpdateApplicationParams,
  }),
  z.object({
    domain: z.literal('object'),
    intent: z.literal('create_object'),
    target: z.string().optional(),
    params: CreateObjectParams,
  }),
  z.object({
    domain: z.literal('object'),
    intent: z.literal('delete_object'),
    target: z.string().optional(),
    params: DeleteObjectParams,
  }),
  z.object({
    domain: z.literal('object'),
    intent: z.literal('update_object_metadata'),
    target: z.string().optional(),
    params: UpdateObjectMetadataParams,
  }),
  z.object({
    domain: z.literal('object'),
    intent: z.literal('manipulate_object_fields'),
    target: z.string().optional(),
    params: ManipulateFieldsParams,
  }),
  z.object({
    domain: z.literal('object'),
    intent: z.literal('design_data_schema'),
    target: z.string().optional(),
    params: DesignDataSchemaParams,
  }),
  z.object({
    domain: z.literal('layout'),
    intent: z.literal('create_layout'),
    target: z.string().optional(),
    params: CreateLayoutParams,
  }),
  z.object({
    domain: z.literal('layout'),
    intent: z.literal('delete_layout'),
    target: z.string().optional(),
    params: DeleteLayoutParams,
  }),
  z.object({
    domain: z.literal('layout'),
    intent: z.literal('update_layout'),
    target: z.string().optional(),
    params: UpdateLayoutParams,
  }),
  z.object({
    domain: z.literal('flow'),
    intent: z.literal('create_flow'),
    target: z.string().optional(),
    params: CreateFlowParams,
  }),
  z.object({
    domain: z.literal('flow'),
    intent: z.literal('delete_flow'),
    target: z.string().optional(),
    params: DeleteFlowParams,
  }),
  z.object({
    domain: z.literal('flow'),
    intent: z.literal('update_flow'),
    target: z.string().optional(),
    params: UpdateFlowParams,
  }),
]);

export type ParamExtractorOutput = z.infer<typeof ParamExtractorSchema>;

const intentParamsExtractorHandler = async (
  input: ParamExtractorOutput,
): Promise<ParamExtractorOutput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const IntentParamsExtractorTool = tool(intentParamsExtractorHandler, {
  name: 'IntentParamsExtractorTool',
  description: 'Classify user prompt to domain-intent-task with structured params',
  schema: ParamExtractorSchema,
});
