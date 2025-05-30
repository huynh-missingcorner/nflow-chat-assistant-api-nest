import { ShortTermMemory, CreatedObject, Field } from '../types';
import { ExecutionResult } from '@/modules/agents/executor-agent/types/executor.types';

export interface IMemoryService {
  getContext(chatSessionId: string): Promise<ShortTermMemory>;
  updateContext(
    context: ShortTermMemory,
    patchData: Partial<ShortTermMemory>,
  ): Promise<ShortTermMemory>;
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
  reset(chatSessionId: string): Promise<void>;
  updateTaskResults(chatSessionId: string, results: ExecutionResult): Promise<void>;
  findObjectByName(context: ShortTermMemory, objectName: string): CreatedObject | undefined;
  findFieldByName(
    context: ShortTermMemory,
    objectName: string,
    fieldName: string,
  ): Field | undefined;
}
