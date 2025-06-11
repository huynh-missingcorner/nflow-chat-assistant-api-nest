import { Injectable } from '@nestjs/common';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

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

      const summaryMessage = await this.generateSummary(messages);

      this.logger.debug(SUMMARIZER_MESSAGES.SUMMARY_GENERATED);

      return this.createSuccessResult({
        messages: [...messages, summaryMessage],
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
  - Application Name: ${appResult.applicationSpec?.appName || 'Not available'}
  - Application ID: ${appResult.executionResult?.appId || 'Not available'}`;
          })
          .join('\n\n')
      : 'No application results available';

    // Process object results with detailed field information
    const objectResultsData = objectResults?.length
      ? objectResults
          .map((result, index) => {
            const { intentId, status, result: objResult, timestamp } = result;

            // Extract object information
            const objectInfo = objResult.executionResult?.createdEntities;
            const objectName = objectInfo?.object || objResult.objectName || 'Not specified';
            const objectDisplayName = objectInfo?.objectDisplayName || 'Not specified';
            const objectDescription = objectInfo?.objectDescription || '';

            // Extract field information with more details
            let fieldsInfo = 'No fields created';
            if (
              objResult.executionResult?.fieldIds &&
              objResult.executionResult.fieldIds.length > 0
            ) {
              // Try to get detailed field information first
              if (objectInfo?.fieldsDetailed && typeof objectInfo.fieldsDetailed === 'string') {
                try {
                  const detailedFields = JSON.parse(objectInfo.fieldsDetailed) as Array<{
                    name: string;
                    displayName: string;
                    typeName: string;
                    description?: string;
                  }>;

                  if (detailedFields.length > 0) {
                    const fieldsList = detailedFields
                      .map((f) => `${f.displayName} (${f.name}) - ${f.typeName}`)
                      .join(', ');
                    fieldsInfo = `${detailedFields.length} fields created: ${fieldsList}`;
                  }
                } catch {
                  // Fallback to basic field count if JSON parsing fails
                  const fieldCount = objResult.executionResult.fieldIds.length;
                  const fieldsList = objResult.executionResult.fieldIds.join(', ');
                  fieldsInfo = `${fieldCount} fields created: ${fieldsList}`;
                }
              } else {
                // Fallback to basic field information
                const fieldCount = objResult.executionResult.fieldIds.length;
                const fieldsList = objResult.executionResult.fieldIds.join(', ');
                fieldsInfo = `${fieldCount} fields created: ${fieldsList}`;
              }
            } else if (
              objectInfo?.fields &&
              Array.isArray(objectInfo.fields) &&
              objectInfo.fields.length > 0
            ) {
              const fieldCount = objectInfo.fields.length;
              const fieldsList = objectInfo.fields.join(', ');
              fieldsInfo = `${fieldCount} fields created: ${fieldsList}`;
            }

            // Extract additional execution details
            const executionStatus = objResult.executionResult?.status || status;
            const executionErrors = objResult.executionResult?.errors?.length
              ? `Errors: ${objResult.executionResult.errors.join(', ')}`
              : 'No errors';

            return `Object ${index + 1}:
  - Intent ID: ${intentId}
  - Status: ${executionStatus}
  - Timestamp: ${timestamp}
  - Object Name: ${objectName}
  - Object Display Name: ${objectDisplayName}
  - Object Description: ${objectDescription}
  - Fields: ${fieldsInfo}
  - Execution Status: ${executionErrors}
  - Summary: ${objResult.summary || 'Object creation completed'}`;
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

  private async generateSummary(messages: (HumanMessage | SystemMessage)[]): Promise<AIMessage> {
    const response = await OPENAI_GPT_4_1_FOR_SUMMARY.invoke(messages);

    if (!response.content) {
      throw new Error('No summary content received from LLM');
    }

    return new AIMessage({
      content: response.content,
      id: response.id,
    });
  }
}
