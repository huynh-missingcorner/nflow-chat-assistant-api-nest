import { Inject, Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

import {
  IntentClassifierOutput,
  IntentClassifierTool,
} from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';
import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { GRAPH_NODES, LOG_MESSAGES, VALIDATION_MESSAGES } from '../constants/graph-constants';
import { COORDINATOR_SYSTEM_PROMPT } from '../constants/tokens';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ClassifyIntentNode extends GraphNodeBase {
  constructor(@Inject(COORDINATOR_SYSTEM_PROMPT) private readonly systemPrompt: string) {
    super();
  }

  async execute(state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> {
    try {
      this.logger.debug(LOG_MESSAGES.CLASSIFYING_INTENT(state.originalMessage));

      // Build context-aware messages including conversation history and execution results
      const messages = this.buildContextAwareMessages(state);

      const { classifiedIntent, classifiedMessage } = await this.performClassification(messages);

      // Log the classified intents
      this.logger.debug(
        LOG_MESSAGES.INTENT_CLASSIFIED,
        `Found ${classifiedIntent.intents.length} intents`,
        classifiedIntent,
      );

      return this.createSuccessResult({
        classifiedIntent,
        messages: [
          new SystemMessage(this.buildContextualSystemPrompt(state)), // Enhanced system prompt with context
          new HumanMessage(state.originalMessage), // Current user message
          classifiedMessage, // AI classification response
        ],
      });
    } catch (error) {
      return this.handleError(error, 'intent classification');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.CLASSIFY_INTENT;
  }

  /**
   * Build context-aware messages for LLM analysis (not stored in state)
   * These messages are used only for classification context, not persisted
   */
  private buildContextAwareMessages(state: CoordinatorStateType): BaseMessage[] {
    const messages: BaseMessage[] = [];

    // Start with the enhanced system prompt
    const contextualSystemPrompt = this.buildContextualSystemPrompt(state);
    messages.push(new SystemMessage(contextualSystemPrompt));

    // Add relevant conversation history for context (limit to last 10 messages to avoid token overflow)
    // These are used for analysis only, not added to the state
    const recentMessages = state.messages.slice(-10);
    if (recentMessages.length > 0) {
      messages.push(new HumanMessage('=== RECENT CONVERSATION HISTORY ==='));
      recentMessages.forEach((msg) => {
        const messageType = msg._getType();
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        messages.push(new HumanMessage(`[${messageType}]: ${content}`));
      });
      messages.push(new HumanMessage('=== END CONVERSATION HISTORY ===\n'));
    }

    // Add current user message
    messages.push(new HumanMessage(state.originalMessage));

    return messages;
  }

  /**
   * Build system prompt with execution context for better target inference
   */
  private buildContextualSystemPrompt(state: CoordinatorStateType): string {
    let contextualPrompt = this.systemPrompt;

    // Add execution results context
    const executionContext = this.buildExecutionContext(state);
    if (executionContext) {
      contextualPrompt += '\n\n' + executionContext;
    }

    return contextualPrompt;
  }

  /**
   * Build execution context from recent operations
   */
  private buildExecutionContext(state: CoordinatorStateType): string {
    const contextSections: string[] = [];

    // Add object execution results
    if (state.objectResults && state.objectResults.length > 0) {
      const recentObjects = state.objectResults
        .filter((result) => result.status === 'success' && result.result.objectName)
        .slice(-5) // Most recent 5 successful operations
        .reverse(); // Most recent first

      if (recentObjects.length > 0) {
        contextSections.push('## Recently Created Objects\n');
        recentObjects.forEach((result, index) => {
          const uniqueName =
            result.result.executionResult?.createdEntities?.object || result.result.objectName;
          const displayName =
            result.result.executionResult?.createdEntities?.objectDisplayName ||
            result.result.objectName;

          contextSections.push(
            `${index + 1}. **${displayName}** (unique ID: ${uniqueName}) - ${result.result.summary || 'Object created successfully'}`,
          );
        });
      }
    }

    // Add application execution results
    if (state.applicationResults && state.applicationResults.length > 0) {
      const recentApps = state.applicationResults
        .filter((result) => result.status === 'success' && result.result.applicationSpec)
        .slice(-3) // Most recent 3 successful operations
        .reverse(); // Most recent first

      if (recentApps.length > 0) {
        contextSections.push('\n## Recently Created Applications\n');
        recentApps.forEach((result, index) => {
          const appName = result.result.applicationSpec?.appName;
          contextSections.push(`${index + 1}. **${appName}** - Application created successfully`);
        });
      }
    }

    if (contextSections.length > 0) {
      return `## EXECUTION CONTEXT

The following entities have been recently created in this conversation session. When users mention field operations, object modifications, or other actions without specifying a target, refer to these recent creations:

${contextSections.join('\n')}

**IMPORTANT**: When inferring targets from context:
- Use unique IDs (like user_1234567) for precise targeting
- Prefer the most recently created entity when multiple options exist
- Note in the details that the target was inferred from conversation context
- If unsure, mention the ambiguity but provide your best inference
`;
    }

    return '';
  }

  private async performClassification(messages: BaseMessage[]): Promise<{
    classifiedIntent: IntentClassifierOutput;
    classifiedMessage: BaseMessage;
  }> {
    const llmWithTools = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([IntentClassifierTool]);
    const response = await llmWithTools.invoke(messages);
    const resultAiMessage = new AIMessage({
      content: response.content,
      id: response.id,
      tool_calls: response.tool_calls,
    });

    if (!response.tool_calls || response.tool_calls.length === 0) {
      throw new Error(VALIDATION_MESSAGES.NO_TOOL_CALLS);
    }

    const toolCall = response.tool_calls[0];
    const classifiedIntents = toolCall.args as IntentClassifierOutput;

    // Generate unique IDs for each intent
    const intentsWithIds = classifiedIntents.intents.map((intent) => ({
      ...intent,
      id: uuidv4(),
    }));

    return {
      classifiedIntent: {
        ...classifiedIntents,
        intents: intentsWithIds,
      },
      classifiedMessage: resultAiMessage,
    };
  }
}
