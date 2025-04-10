import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { GenerateObjectsParams, GenerateObjectsResponse } from './types/object.types';
import { ObjectErrors } from './constants/object.constants';
import { tools as objectTools } from './tools/object-tools';

@Injectable()
export class ObjectService {
  private readonly logger = new Logger(ObjectService.name);
  private readonly AGENT_PATH = AGENT_PATHS.OBJECT;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate object definitions and their field schemas based on application features and components
   * @param params Parameters containing features, components, and session information
   * @returns Object and field definitions with suggested next steps
   */
  async generateObjects(params: GenerateObjectsParams): Promise<GenerateObjectsResponse> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        {
          role: 'user' as const,
          content: this.buildPrompt(params),
        },
      ];

      const options = {
        tools: objectTools,
        tool_choice: 'auto' as const,
        temperature: 0.7, // Add some creativity for schema design
        max_tokens: 2000, // Ensure enough tokens for comprehensive schema
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!completion.toolCalls?.length) {
        throw new Error(ObjectErrors.GENERATION_FAILED);
      }

      // Process all tool calls and organize them
      const toolCalls = completion.toolCalls.map((toolCall, index) => {
        const functionCall = toolCall.function;
        return {
          order: index + 1, // Ensure 1-based ordering
          toolCall: {
            functionName: functionCall.name,
            arguments: JSON.parse(functionCall.arguments) as Record<string, unknown>,
          },
        };
      });

      return {
        toolCalls,
        metadata: {
          totalObjects: params.objects.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Object generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }

  private buildPrompt(params: GenerateObjectsParams): string {
    return `As a database schema expert, design complete object schemas for: ${JSON.stringify(params, null, 2)}.

Requirements:
1. For each object, first create the object structure using ObjectController_changeObject
2. Then create all necessary fields using FieldController_changeField
3. Follow the schema design rules in the context
4. Include all common required fields (id, createdAt, etc.)
5. Add context-specific fields based on the object type
6. Ensure proper field types and attributes
7. Make fields searchable and required as appropriate

Action: ${params.action}
Objects to process: ${JSON.stringify(params.objects, null, 2)}`;
  }

  private async loadAgentContexts(): Promise<string> {
    try {
      const contextFiles = await this.contextLoader.loadContextDirectory(
        `${this.AGENT_PATH}/${this.CONTEXTS_PATH}`,
      );

      return contextFiles
        .map((file: ContextFile) => `# ${file.name}\n\n${file.content}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error('Failed to load agent contexts', error);
      throw new Error(ObjectErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
