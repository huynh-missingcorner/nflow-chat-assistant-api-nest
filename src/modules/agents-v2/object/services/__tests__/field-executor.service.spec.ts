import { Test, TestingModule } from '@nestjs/testing';

import type { ApiFormatParserInput } from '@/modules/agents-v2/object/tools/others/api-format-parser.tool';
import { ObjectStateType } from '@/modules/agents-v2/object/types/object-graph-state.types';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldResponse } from '@/modules/nflow/types';

import { FieldExecutorService } from '../field-executor.service';
import { FieldExecutionStep } from '../interfaces/field-executor.service.interface';

describe('FieldExecutorService', () => {
  let service: FieldExecutorService;
  let chatSessionService: jest.Mocked<ChatSessionService>;
  let nflowObjectService: jest.Mocked<NFlowObjectService>;

  const mockUserId = 'test-user-id';
  const mockChatSessionId = 'test-chat-session-id';

  const createMockFieldResponse = (overrides: Partial<FieldResponse> = {}): FieldResponse => {
    return {
      id: 'field_123',
      name: 'testField',
      displayName: 'Test Field',
      isRequired: false,
      description: 'Test field description',
      isExternalId: false,
      attributes: {},
      isSystemDefault: false,
      isDeleted: false,
      dataType: {
        id: 'datatype_123',
        name: 'text',
        systemType: 'text',
        displayName: 'Text',
        attributes: {},
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      ...overrides,
    };
  };

  const createMockState = (overrides: Partial<ObjectStateType> = {}): ObjectStateType => {
    return {
      messages: [],
      originalMessage: mockChatSessionId,
      chatSessionId: mockChatSessionId,
      intent: null,
      createdObjects: [],
      objectNameMapping: {},
      schemaSpec: null,
      schemaDesignResult: null,
      schemaExecutionResult: null,
      currentObjectIndex: 0,
      isSchemaDesign: false,
      fieldSpec: null,
      objectSpec: null,
      dbDesignResult: null,
      typeMappingResult: null,
      executionResult: null,
      error: null,
      currentNode: 'start',
      retryCount: 0,
      isCompleted: false,
      ...overrides,
    };
  };

  beforeEach(async () => {
    const mockChatSessionService = {
      getUserIdFromChatSession: jest.fn(),
    };

    const mockNFlowObjectService = {
      changeField: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldExecutorService,
        {
          provide: ChatSessionService,
          useValue: mockChatSessionService,
        },
        {
          provide: NFlowObjectService,
          useValue: mockNFlowObjectService,
        },
      ],
    }).compile();

    service = module.get<FieldExecutorService>(FieldExecutorService);
    chatSessionService = module.get(ChatSessionService);
    nflowObjectService = module.get(NFlowObjectService);
  });

  describe('buildFieldExecutionPlan', () => {
    it('should return null when no API format is found', () => {
      const state = createMockState({
        typeMappingResult: {
          mappedFields: [],
        },
      });

      const result = service.buildFieldExecutionPlan(state);

      expect(result).toBeNull();
    });

    it('should return null when API format exists but no fields format', () => {
      const state = createMockState({
        typeMappingResult: {
          mappedFields: [],
          apiFormat: {
            objectFormat: {
              name: 'TestObject',
              data: {
                name: 'TestObject',
                displayName: 'Test Object',
                recordName: { type: 'text', label: 'Test Object' },
                owd: 'Private',
              },
              action: 'create',
            },
            fieldsFormat: [],
          } as ApiFormatParserInput,
        },
      });

      const result = service.buildFieldExecutionPlan(state);

      expect(result).toEqual({ steps: [] });
    });

    it('should build execution plan with create action by default', () => {
      const mockFieldData = {
        objName: 'TestObject',
        data: {
          name: 'testField',
          displayName: 'Test Field',
          typeName: 'text' as const,
          value: 'test value',
        },
        action: 'create' as const,
      };

      const state = createMockState({
        typeMappingResult: {
          mappedFields: [],
          apiFormat: {
            objectFormat: {
              name: 'TestObject',
              data: {
                name: 'TestObject',
                displayName: 'Test Object',
                recordName: { type: 'text', label: 'Test Object' },
                owd: 'Private',
              },
              action: 'create',
            },
            fieldsFormat: [mockFieldData],
          } as ApiFormatParserInput,
        },
      });

      const result = service.buildFieldExecutionPlan(state);

      expect(result).toEqual({
        steps: [
          {
            type: 'create_field',
            action: 'create',
            fieldData: mockFieldData,
            description: 'create field: testField',
          },
        ],
      });
    });

    it('should use custom action from fieldSpec', () => {
      const mockFieldData = {
        objName: 'TestObject',
        data: {
          name: 'testField',
          displayName: 'Test Field',
          typeName: 'text' as const,
        },
        action: 'create' as const,
      };

      const state = createMockState({
        fieldSpec: {
          name: 'testField',
          typeHint: 'text',
          action: 'update',
        },
        typeMappingResult: {
          mappedFields: [],
          apiFormat: {
            objectFormat: {
              name: 'TestObject',
              data: {
                name: 'TestObject',
                displayName: 'Test Object',
                recordName: { type: 'text', label: 'Test Object' },
                owd: 'Private',
              },
              action: 'create',
            },
            fieldsFormat: [mockFieldData],
          } as ApiFormatParserInput,
        },
      });

      const result = service.buildFieldExecutionPlan(state);

      expect(result?.steps[0]).toMatchObject({
        type: 'update_field',
        action: 'update',
        description: 'update field: testField',
      });
    });
  });

  describe('buildObjectNameMapping', () => {
    it('should return empty map when no mappings exist', () => {
      const state = createMockState();

      const result = service.buildObjectNameMapping(state);

      expect(result).toEqual(new Map());
    });

    it('should build mapping from objectNameMapping', () => {
      const state = createMockState({
        objectNameMapping: {
          OriginalObject: 'UniqueObject_123',
        },
      });

      const result = service.buildObjectNameMapping(state);

      expect(result.get('OriginalObject')).toBe('UniqueObject_123');
    });

    it('should build mapping from createdObjects', () => {
      const state = createMockState({
        createdObjects: [
          {
            originalName: 'Object1',
            uniqueName: 'Object1_456',
            displayName: 'Object 1',
            createdAt: '2023-01-01T00:00:00Z',
            intentIndex: 0,
          },
        ],
      });

      const result = service.buildObjectNameMapping(state);

      expect(result.get('Object1')).toBe('Object1_456');
    });

    it('should merge both mapping sources', () => {
      const state = createMockState({
        objectNameMapping: {
          SchemaObject: 'SchemaObject_123',
        },
        createdObjects: [
          {
            originalName: 'ThreadObject',
            uniqueName: 'ThreadObject_456',
            displayName: 'Thread Object',
            createdAt: '2023-01-01T00:00:00Z',
            intentIndex: 0,
          },
        ],
      });

      const result = service.buildObjectNameMapping(state);

      expect(result.get('SchemaObject')).toBe('SchemaObject_123');
      expect(result.get('ThreadObject')).toBe('ThreadObject_456');
    });
  });

  describe('transformFieldDataToDto', () => {
    it('should transform basic field data to FieldDto', () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'testField',
            displayName: 'Test Field',
            typeName: 'text',
            value: 'test value',
            description: 'Test description',
          },
          action: 'create',
        },
        description: 'create field: testField',
      };

      const state = createMockState();

      const result = service.transformFieldDataToDto(step, state);

      expect(result).toEqual({
        objName: 'TestObject',
        action: 'create',
        data: {
          typeName: 'text',
          name: 'testField',
          displayName: 'Test Field',
          value: 'test value',
          description: 'Test description',
          pickListId: undefined,
          attributes: undefined,
        },
      });
    });

    it('should map object name using name mapping', () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'OriginalObject',
          data: {
            name: 'testField',
            displayName: 'Test Field',
            typeName: 'text',
          },
          action: 'create',
        },
        description: 'create field: testField',
      };

      const state = createMockState({
        objectNameMapping: {
          OriginalObject: 'MappedObject_123',
        },
      });

      const result = service.transformFieldDataToDto(step, state);

      expect(result.objName).toBe('MappedObject_123');
    });

    it('should map relation target object name', () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'relationField',
            displayName: 'Relation Field',
            typeName: 'relation',
            value: 'TargetObject',
          },
          action: 'create',
        },
        description: 'create field: relationField',
      };

      const state = createMockState({
        objectNameMapping: {
          TargetObject: 'MappedTarget_456',
        },
      });

      const result = service.transformFieldDataToDto(step, state);

      expect(result.data.value).toBe('MappedTarget_456');
    });

    it('should include pickListId from field spec for pickList fields', () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'pickListField',
            displayName: 'Pick List Field',
            typeName: 'pickList',
          },
          action: 'create',
        },
        description: 'create field: pickListField',
      };

      const state = createMockState({
        fieldSpec: {
          name: 'pickListField',
          typeHint: 'pickList',
          action: 'create',
          pickListInfo: {
            needsNewPickList: true,
            createdPickListId: 'picklist_123',
          },
        },
      });

      const result = service.transformFieldDataToDto(step, state);

      expect(result.data.pickListId).toBe('picklist_123');
    });

    it('should handle delete action with simplified structure', () => {
      const step: FieldExecutionStep = {
        type: 'delete_field',
        action: 'delete',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'fieldToDelete',
            displayName: 'Field To Delete',
            typeName: 'text',
          },
          action: 'delete',
        },
        description: 'delete field: fieldToDelete',
      };

      const state = createMockState();

      const result = service.transformFieldDataToDto(step, state);

      expect(result).toEqual({
        objName: 'TestObject',
        action: 'delete',
        name: 'fieldToDelete',
        data: {
          name: 'fieldToDelete',
          typeName: 'text',
          displayName: 'Field To Delete',
        },
      });
    });
  });

  describe('executeFieldStep', () => {
    it('should successfully execute create field step', async () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'testField',
            displayName: 'Test Field',
            typeName: 'text',
          },
          action: 'create',
        },
        description: 'create field: testField',
      };

      const state = createMockState();

      nflowObjectService.changeField.mockResolvedValue(createMockFieldResponse());

      const result = await service.executeFieldStep(step, mockUserId, state);

      expect(result).toEqual({
        success: true,
        fieldId: 'testField',
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(nflowObjectService.changeField).toHaveBeenCalledWith(
        expect.objectContaining({
          objName: 'TestObject',
          action: 'create',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            name: 'testField',
            typeName: 'text',
          }),
        }),
        mockUserId,
      );
    });

    it('should handle API errors gracefully', async () => {
      const step: FieldExecutionStep = {
        type: 'create_field',
        action: 'create',
        fieldData: {
          objName: 'TestObject',
          data: {
            name: 'testField',
            displayName: 'Test Field',
            typeName: 'text',
          },
          action: 'create',
        },
        description: 'create field: testField',
      };

      const state = createMockState();

      const error = new Error('API Error');
      nflowObjectService.changeField.mockRejectedValue(error);

      const result = await service.executeFieldStep(step, mockUserId, state);

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      });
    });
  });

  describe('executeFieldSteps', () => {
    beforeEach(() => {
      chatSessionService.getUserIdFromChatSession.mockResolvedValue(mockUserId);
    });

    it('should fail when unable to get userId', async () => {
      chatSessionService.getUserIdFromChatSession.mockRejectedValue(new Error('User not found'));

      const steps: FieldExecutionStep[] = [];
      const state = createMockState();

      const result = await service.executeFieldSteps(steps, mockChatSessionId, state);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Failed to get user information: User not found');
    });

    it('should execute multiple steps successfully', async () => {
      const steps: FieldExecutionStep[] = [
        {
          type: 'create_field',
          action: 'create',
          fieldData: {
            objName: 'TestObject',
            data: { name: 'field1', displayName: 'Field 1', typeName: 'text' },
            action: 'create',
          },
          description: 'create field: field1',
        },
        {
          type: 'create_field',
          action: 'create',
          fieldData: {
            objName: 'TestObject',
            data: { name: 'field2', displayName: 'Field 2', typeName: 'text' },
            action: 'create',
          },
          description: 'create field: field2',
        },
      ];

      const state = createMockState();

      nflowObjectService.changeField
        .mockResolvedValueOnce(createMockFieldResponse({ name: 'field1' }))
        .mockResolvedValueOnce(createMockFieldResponse({ name: 'field2' }));

      const result = await service.executeFieldSteps(steps, mockChatSessionId, state);

      expect(result.status).toBe('success');
      expect(result.fieldIds).toEqual(['field1', 'field2']);
      expect(result.completedSteps).toHaveLength(2);
      expect(result.createdEntities?.fields).toEqual(['field1', 'field2']);
    });

    it('should handle partial failures correctly', async () => {
      const steps: FieldExecutionStep[] = [
        {
          type: 'create_field',
          action: 'create',
          fieldData: {
            objName: 'TestObject',
            data: { name: 'field1', displayName: 'Field 1', typeName: 'text' },
            action: 'create',
          },
          description: 'create field: field1',
        },
        {
          type: 'create_field',
          action: 'create',
          fieldData: {
            objName: 'TestObject',
            data: { name: 'field2', displayName: 'Field 2', typeName: 'text' },
            action: 'create',
          },
          description: 'create field: field2',
        },
      ];

      const state = createMockState();

      nflowObjectService.changeField
        .mockResolvedValueOnce(createMockFieldResponse({ name: 'field1' }))
        .mockRejectedValueOnce(new Error('Field 2 failed'));

      const result = await service.executeFieldSteps(steps, mockChatSessionId, state);

      expect(result.status).toBe('partial');
      expect(result.fieldIds).toEqual(['field1']);
      expect(result.errors).toContain('Step 2 failed: Field 2 failed');
      expect(result.completedSteps).toHaveLength(1);
    });

    it('should preserve previous execution results', async () => {
      const steps: FieldExecutionStep[] = [
        {
          type: 'create_field',
          action: 'create',
          fieldData: {
            objName: 'TestObject',
            data: { name: 'newField', displayName: 'New Field', typeName: 'text' },
            action: 'create',
          },
          description: 'create field: newField',
        },
      ];

      const state = createMockState();

      const previousResult = {
        status: 'partial' as const,
        fieldIds: ['existingField'],
        createdEntities: { fields: ['existingField'] },
        errors: ['Previous error'],
        completedSteps: [
          {
            type: 'create_field' as const,
            stepIndex: 0,
            entityId: 'existingField',
          },
        ],
      };

      nflowObjectService.changeField.mockResolvedValue(
        createMockFieldResponse({ name: 'newField' }),
      );

      const result = await service.executeFieldSteps(
        steps,
        mockChatSessionId,
        state,
        previousResult,
      );

      expect(result.status).toBe('success');
      expect(result.fieldIds).toEqual(['existingField', 'newField']);
      expect(result.errors).toEqual(['Previous error']);
      expect(result.completedSteps).toHaveLength(2);
    });
  });
});
