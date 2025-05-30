import { ShortTermMemory, CreatedObject, Field } from '../types';

export const REDIS_PREFIX = 'memory:chat-session:';
export const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week in seconds

/**
 * Generates Redis key for a chat session
 */
export function getRedisKey(chatSessionId: string): string {
  return `${REDIS_PREFIX}${chatSessionId}`;
}

/**
 * Finds an object by name in the memory context
 */
export function findObjectByName(
  context: ShortTermMemory,
  objectName: string,
): CreatedObject | undefined {
  return context.createdObjects.find((obj) => obj.name.toLowerCase() === objectName.toLowerCase());
}

/**
 * Finds a field by name within an object in the memory context
 */
export function findFieldByName(
  context: ShortTermMemory,
  objectName: string,
  fieldName: string,
): Field | undefined {
  const obj = findObjectByName(context, objectName);
  return obj?.fields.find((f) => f.name.toLowerCase() === fieldName.toLowerCase());
}

/**
 * Returns the created applications from memory context
 */
export function getCreatedApplications(
  context: ShortTermMemory,
): ShortTermMemory['createdApplications'] {
  return context.createdApplications;
}

/**
 * Creates an initial empty memory context structure
 */
export function createInitialContext(
  chatSessionId: string,
  chatHistory: ShortTermMemory['chatHistory'],
): ShortTermMemory {
  return {
    chatSessionId,
    chatHistory,
    createdApplications: [],
    createdObjects: [],
    createdLayouts: [],
    createdFlows: [],
    toolCallsLog: [],
    taskResults: {},
    pendingHITL: [],
    timestamp: new Date(),
  };
}
