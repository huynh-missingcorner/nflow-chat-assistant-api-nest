import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ToolCall } from '@langchain/core/messages/tool';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import { APP_DESIGN_SYSTEM_PROMPT, formatAppDesignPrompt } from '../context/app-design.context';
import { AppDesignInput, appDesignTool, appValidationTool } from '../tools/app-design.tool';
import {
  ApplicationStateType,
  EnrichedApplicationSpec,
} from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

interface ValidationResult {
  isValid: boolean;
  validationErrors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

interface ProcessedToolCalls {
  enrichedSpec: EnrichedApplicationSpec;
}

@Injectable()
export class AppDesignNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.APP_DESIGN;
  }

  async execute(state: ApplicationStateType): Promise<Partial<ApplicationStateType>> {
    try {
      this.logger.log('Starting application design enhancement');

      if (!state.applicationSpec) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': applicationSpec');
      }

      const llm = OPENAI_GPT_4_1.bindTools([appDesignTool, appValidationTool]);

      const messages = [
        new SystemMessage(APP_DESIGN_SYSTEM_PROMPT),
        new HumanMessage(formatAppDesignPrompt(state.applicationSpec)),
      ];

      const result = await llm.invoke(messages);

      // Process tool calls
      const designResult = this.processToolCalls(result.tool_calls || []);

      // Validate the enriched specification
      this.validateEnrichedSpec(designResult.enrichedSpec);

      this.logger.log(APPLICATION_LOG_MESSAGES.DESIGN_COMPLETED);

      return this.createSuccessResult({
        enrichedSpec: designResult.enrichedSpec,
        messages: state.messages.concat(result),
      });
    } catch (error) {
      this.logger.error('Error in application design:', error);
      return this.handleError(error, 'AppDesignNode');
    }
  }

  private processToolCalls(toolCalls: ToolCall[]): ProcessedToolCalls {
    let enrichedSpec: EnrichedApplicationSpec | null = null;
    let validationResult: ValidationResult | null = null;

    for (const toolCall of toolCalls) {
      if (toolCall.name === 'app_design_enhancer') {
        enrichedSpec = this.generateEnrichedSpec(toolCall.args as AppDesignInput);
      } else if (toolCall.name === 'app_validation_checker') {
        validationResult = toolCall.args as ValidationResult;
      }
    }

    if (!enrichedSpec) {
      throw new Error('No design enhancement found in LLM response');
    }

    if (validationResult && !validationResult.isValid) {
      throw new Error(
        APPLICATION_ERROR_MESSAGES.DESIGN_VALIDATION_FAILED +
          ': ' +
          (validationResult.validationErrors?.join(', ') || 'Unknown validation error'),
      );
    }

    return { enrichedSpec };
  }

  private generateEnrichedSpec(designArgs: AppDesignInput): EnrichedApplicationSpec {
    const timestamp = Date.now();
    const appDomain = this.extractDomainFromName(designArgs.appName);

    return {
      appName: designArgs.appName,
      description: designArgs.description,
      objects: Array.isArray(designArgs.objects) ? designArgs.objects : [],
      layouts: Array.isArray(designArgs.layouts) ? designArgs.layouts : [],
      flows: Array.isArray(designArgs.flows) ? designArgs.flows : [],
      metadata:
        typeof designArgs.metadata === 'object' && designArgs.metadata !== null
          ? designArgs.metadata
          : {},
      appId: designArgs.appId || this.generateAppId(appDomain, timestamp),
      objectIds: this.generateObjectIds(
        Array.isArray(designArgs.objects) ? designArgs.objects : [],
        appDomain,
        timestamp,
      ),
      layoutIds: this.generateLayoutIds(
        Array.isArray(designArgs.layouts) ? designArgs.layouts : [],
        appDomain,
        timestamp,
      ),
      flowIds: this.generateFlowIds(
        Array.isArray(designArgs.flows) ? designArgs.flows : [],
        appDomain,
        timestamp,
      ),
      dependencies: Array.isArray(designArgs.dependencies) ? designArgs.dependencies : [],
    };
  }

  private extractDomainFromName(appName: string): string {
    return appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
  }

  private generateAppId(domain: string, timestamp: number): string {
    return `app_${domain}_${timestamp}`;
  }

  private generateObjectIds(objects: string[], domain: string, timestamp: number): string[] {
    return objects.map((obj, index) => `obj_${obj.toLowerCase()}_${domain}_${timestamp}_${index}`);
  }

  private generateLayoutIds(layouts: string[], domain: string, timestamp: number): string[] {
    return layouts.map(
      (layout, index) => `layout_${layout.toLowerCase()}_${domain}_${timestamp}_${index}`,
    );
  }

  private generateFlowIds(flows: string[], domain: string, timestamp: number): string[] {
    return flows.map((flow, index) => `flow_${flow.toLowerCase()}_${domain}_${timestamp}_${index}`);
  }

  private validateEnrichedSpec(spec: EnrichedApplicationSpec): void {
    if (!spec.appId) {
      throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': appId');
    }

    if (!spec.appName || spec.appName.trim().length === 0) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': appName cannot be empty');
    }

    // Validate ID format
    if (!spec.appId.startsWith('app_')) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': invalid appId format');
    }
  }
}
