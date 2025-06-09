import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_SUMMARY } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { GRAPH_NODES, SUMMARIZER_MESSAGES } from '../constants/graph-constants';
import { SUMMARIZER_PROMPTS } from '../constants/prompt';
import type { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class SummarizeExecutionNode extends GraphNodeBase {
  constructor() {
    super();
  }

  async execute(state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> {
    try {
      this.logger.debug(SUMMARIZER_MESSAGES.STARTING_SUMMARY);

      const structuredData = this.extractStructuredData(state);
      const humanMessage = this.formatHumanMessage(structuredData);

      const messages = [
        new SystemMessage(SUMMARIZER_PROMPTS.SYSTEM_PROMPT),
        new HumanMessage(humanMessage),
      ];

      const summary = await this.generateSummary(messages);

      this.logger.debug(SUMMARIZER_MESSAGES.SUMMARY_GENERATED);

      return this.createSuccessResult({
        messages: [
          ...state.messages,
          new SystemMessage(`${SUMMARIZER_MESSAGES.SUMMARY_ERROR_PREFIX}${summary}`),
        ],
        isCompleted: true,
      });
    } catch (error) {
      return this.handleError(error, SUMMARIZER_MESSAGES.SUMMARY_FAILED, 'summary-error');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.SUMMARIZE_EXECUTION;
  }

  private extractStructuredData(state: CoordinatorStateType) {
    const {
      originalMessage,
      classifiedIntent,
      processedIntents,
      errors,
      applicationResults,
      objectResults,
    } = state;

    // Process classified intent data
    const classifiedIntentData = classifiedIntent
      ? `Intents Count: ${classifiedIntent.intents?.length || 0}\nIntents: ${JSON.stringify(classifiedIntent.intents, null, 2)}\nDependencies: ${classifiedIntent.dependencies ? JSON.stringify(classifiedIntent.dependencies, null, 2) : 'None'}`
      : 'No intent classification data available';

    // Process application results
    const applicationResultsData = applicationResults?.length
      ? applicationResults
          .map((result, index) => {
            const { intentId, status, result: appResult, timestamp } = result;
            return `Application ${index + 1}:
  - Intent ID: ${intentId}
  - Status: ${status}
  - Timestamp: ${timestamp}
  - Application Spec: ${appResult.applicationSpec ? JSON.stringify(appResult.applicationSpec, null, 2) : 'Not available'}
  - Enriched Spec: ${appResult.enrichedSpec ? 'Available' : 'Not available'}
  - Execution Result: ${appResult.executionResult ? JSON.stringify(appResult.executionResult, null, 2) : 'Not available'}`;
          })
          .join('\n\n')
      : 'No application results available';

    // Process object results
    const objectResultsData = objectResults?.length
      ? objectResults
          .map((result, index) => {
            const { intentId, status, result: objResult, timestamp } = result;
            return `Object ${index + 1}:
  - Intent ID: ${intentId}
  - Status: ${status}
  - Timestamp: ${timestamp}
  - Object Name: ${objResult.objectName || 'Not specified'}
  - Summary: ${objResult.summary || 'Not available'}
  - Entities Created: ${objResult.entitiesCreated ? `${objResult.entitiesCreated.objectCount} objects, ${objResult.entitiesCreated.fieldCount} fields` : 'Not available'}
  - Execution Result: ${objResult.executionResult ? JSON.stringify(objResult.executionResult, null, 2) : 'Not available'}`;
          })
          .join('\n\n')
      : 'No object results available';

    // Process errors
    const errorsData = errors?.length
      ? errors
          .map((error, index) => {
            return `Error ${index + 1}:
  - Intent ID: ${error.intentId}
  - Message: ${error.errorMessage}
  - Timestamp: ${error.timestamp}
  - Retry Count: ${error.retryCount}`;
          })
          .join('\n\n')
      : 'No errors encountered';

    // Calculate summary statistics
    const totalIntentsProcessed = processedIntents?.length || 0;
    const processedIntentIds = processedIntents?.join(', ') || 'None';
    const totalErrors = errors?.length || 0;
    const successfulApplications =
      applicationResults?.filter((r) => r.status === 'success').length || 0;
    const successfulObjects = objectResults?.filter((r) => r.status === 'success').length || 0;
    const successfulOperations = successfulApplications + successfulObjects;

    const overallStatus =
      totalErrors === 0 && successfulOperations > 0
        ? 'Success'
        : totalErrors > 0 && successfulOperations > 0
          ? 'Partial Success'
          : 'Failed';

    return {
      originalMessage: originalMessage || 'No original message available',
      classifiedIntentData,
      totalIntentsProcessed,
      processedIntentIds,
      applicationResultsData,
      objectResultsData,
      errorsData,
      overallStatus,
      totalErrors,
      successfulOperations,
    };
  }

  private formatHumanMessage(data: ReturnType<typeof this.extractStructuredData>): string {
    return SUMMARIZER_PROMPTS.HUMAN_MESSAGE_TEMPLATE.replace(
      '{originalMessage}',
      data.originalMessage,
    )
      .replace('{classifiedIntentData}', data.classifiedIntentData)
      .replace('{totalIntentsProcessed}', data.totalIntentsProcessed.toString())
      .replace('{processedIntentIds}', data.processedIntentIds)
      .replace('{applicationResultsData}', data.applicationResultsData)
      .replace('{objectResultsData}', data.objectResultsData)
      .replace('{errorsData}', data.errorsData)
      .replace('{overallStatus}', data.overallStatus)
      .replace('{totalErrors}', data.totalErrors.toString())
      .replace('{successfulOperations}', data.successfulOperations.toString());
  }

  private async generateSummary(messages: (HumanMessage | SystemMessage)[]): Promise<string> {
    const response = await OPENAI_GPT_4_1_FOR_SUMMARY.invoke(messages);

    if (!response.content) {
      throw new Error('No summary content received from LLM');
    }

    return response.content as string;
  }
}
