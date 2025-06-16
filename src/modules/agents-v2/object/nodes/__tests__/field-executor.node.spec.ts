import { Test, TestingModule } from '@nestjs/testing';

import { OBJECT_GRAPH_NODES } from '@/modules/agents-v2/object/constants/object-graph.constants';
import { FieldExecutorService } from '@/modules/agents-v2/object/services/field-executor.service';
import {
  ObjectExecutionResult,
  ObjectStateType,
} from '@/modules/agents-v2/object/types/object-graph-state.types';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';

import { FieldExecutorNode } from '../field-executor.node';

describe('FieldExecutorNode', () => {
  let node: FieldExecutorNode;
  let fieldExecutorService: jest.Mocked<FieldExecutorService>;

  const mockChatSessionId = 'test-chat-session-id';

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
    const mockFieldExecutorService = {
      buildFieldExecutionPlan: jest.fn(),
      executeFieldSteps: jest.fn(),
    };

    const mockChatSessionService = {
      getUserIdFromChatSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldExecutorNode,
        {
          provide: FieldExecutorService,
          useValue: mockFieldExecutorService,
        },
        {
          provide: ChatSessionService,
          useValue: mockChatSessionService,
        },
      ],
    }).compile();

    node = module.get<FieldExecutorNode>(FieldExecutorNode);
    fieldExecutorService = module.get(FieldExecutorService);
  });

  describe('execute', () => {
    it('should return error when execution plan cannot be built', async () => {
      const state = createMockState();
      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue(null);

      const result = await node.execute(state);

      expect(result).toEqual({
        error: 'Field execution failed: Unable to build field execution plan from state',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        executionResult: undefined,
      });
    });

    it('should return error when execution plan has no steps', async () => {
      const state = createMockState();
      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue({ steps: [] });

      const result = await node.execute(state);

      expect(result).toEqual({
        error: 'Field execution failed: Unable to build field execution plan from state',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        executionResult: undefined,
      });
    });

    it('should return error when execution fails with no successful operations', async () => {
      const state = createMockState();
      const mockPlan = {
        steps: [
          {
            type: 'create_field' as const,
            action: 'create' as const,
            fieldData: {
              objName: 'TestObject',
              data: {
                name: 'testField',
                displayName: 'Test Field',
                typeName: 'text' as const,
              },
              action: 'create' as const,
            },
            description: 'create field: testField',
          },
        ],
      };

      const mockExecutionResult: ObjectExecutionResult = {
        status: 'failed',
        fieldIds: [],
        completedSteps: [],
        createdEntities: {},
        errors: ['Field creation failed'],
      };

      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue(mockPlan);
      fieldExecutorService.executeFieldSteps.mockResolvedValue(mockExecutionResult);

      const result = await node.execute(state);

      expect(result).toEqual({
        error: 'Field execution failed: Field creation failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        executionResult: mockExecutionResult,
      });
    });

    it('should return success when execution fails but has successful operations', async () => {
      const state = createMockState();
      const mockPlan = {
        steps: [
          {
            type: 'create_field' as const,
            action: 'create' as const,
            fieldData: {
              objName: 'TestObject',
              data: {
                name: 'testField',
                displayName: 'Test Field',
                typeName: 'text' as const,
              },
              action: 'create' as const,
            },
            description: 'create field: testField',
          },
        ],
      };

      const mockExecutionResult: ObjectExecutionResult = {
        status: 'failed',
        fieldIds: ['testField'],
        completedSteps: [
          {
            type: 'create_field',
            stepIndex: 0,
            entityId: 'testField',
          },
        ],
        createdEntities: { fields: ['testField'] },
        errors: ['Some error'],
      };

      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue(mockPlan);
      fieldExecutorService.executeFieldSteps.mockResolvedValue(mockExecutionResult);

      const result = await node.execute(state);

      expect(result).toEqual({
        executionResult: mockExecutionResult,
        currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        isCompleted: true,
      });
    });

    it('should return success when execution succeeds', async () => {
      const state = createMockState();
      const mockPlan = {
        steps: [
          {
            type: 'create_field' as const,
            action: 'create' as const,
            fieldData: {
              objName: 'TestObject',
              data: {
                name: 'testField',
                displayName: 'Test Field',
                typeName: 'text' as const,
              },
              action: 'create' as const,
            },
            description: 'create field: testField',
          },
        ],
      };

      const mockExecutionResult: ObjectExecutionResult = {
        status: 'success',
        fieldIds: ['testField'],
        completedSteps: [
          {
            type: 'create_field',
            stepIndex: 0,
            entityId: 'testField',
          },
        ],
        createdEntities: { fields: ['testField'] },
      };

      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue(mockPlan);
      fieldExecutorService.executeFieldSteps.mockResolvedValue(mockExecutionResult);

      const result = await node.execute(state);

      expect(result).toEqual({
        executionResult: mockExecutionResult,
        currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        isCompleted: true,
      });
    });

    it('should pass previous execution result to service', async () => {
      const state = createMockState({
        executionResult: {
          status: 'partial',
          fieldIds: ['existingField'],
          completedSteps: [],
          createdEntities: {},
        },
      });

      const mockPlan = {
        steps: [
          {
            type: 'create_field' as const,
            action: 'create' as const,
            fieldData: {
              objName: 'TestObject',
              data: {
                name: 'testField',
                displayName: 'Test Field',
                typeName: 'text' as const,
              },
              action: 'create' as const,
            },
            description: 'create field: testField',
          },
        ],
      };

      const mockExecutionResult: ObjectExecutionResult = {
        status: 'success',
        fieldIds: ['existingField', 'testField'],
        completedSteps: [],
        createdEntities: {},
      };

      fieldExecutorService.buildFieldExecutionPlan.mockReturnValue(mockPlan);
      fieldExecutorService.executeFieldSteps.mockResolvedValue(mockExecutionResult);

      await node.execute(state);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(fieldExecutorService.executeFieldSteps).toHaveBeenCalledWith(
        mockPlan.steps,
        mockChatSessionId,
        state,
        state.executionResult,
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      const state = createMockState();
      const error = new Error('Unexpected error');

      fieldExecutorService.buildFieldExecutionPlan.mockImplementation(() => {
        throw error;
      });

      const result = await node.execute(state);

      expect(result).toEqual({
        error: 'Field execution failed: Unexpected error',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        executionResult: undefined,
      });
    });

    it('should handle non-Error exceptions', async () => {
      const state = createMockState();

      fieldExecutorService.buildFieldExecutionPlan.mockImplementation(() => {
        throw new Error('String error');
      });

      const result = await node.execute(state);

      expect(result).toEqual({
        error: 'Field execution failed: String error',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        executionResult: undefined,
      });
    });
  });
});
