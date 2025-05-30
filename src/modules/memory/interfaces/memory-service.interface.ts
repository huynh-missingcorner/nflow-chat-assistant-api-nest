import { ShortTermMemory, CreatedObject, Field } from '../types';
import { ExecutionResult } from '@/modules/agents/executor-agent/types/executor.types';

export interface IMemoryService {
  // Context Management
  getContext(chatSessionId: string): Promise<ShortTermMemory>;
  updateContext(
    context: ShortTermMemory,
    patchData: Partial<ShortTermMemory>,
  ): Promise<ShortTermMemory>;
  reset(chatSessionId: string): Promise<void>;

  // Field Access & Mutation
  getField<T extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: T,
  ): Promise<ShortTermMemory[T]>;

  setField<T extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: T,
    value: ShortTermMemory[T],
  ): Promise<void>;

  appendToFieldArray<K extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: K,
    item: ShortTermMemory[K] extends Array<infer U> ? U : never,
  ): Promise<void>;

  // Execution Results
  updateTaskResults(chatSessionId: string, results: ExecutionResult): Promise<void>;

  // Object & Field Lookup
  findObjectByName(context: ShortTermMemory, objectName: string): CreatedObject | undefined;

  findFieldByName(
    context: ShortTermMemory,
    objectName: string,
    fieldName: string,
  ): Field | undefined;
}
