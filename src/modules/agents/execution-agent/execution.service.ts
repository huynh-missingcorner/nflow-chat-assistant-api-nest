import { Injectable, Logger } from '@nestjs/common';
import { ExecuteApiCallParams, ExecutionResponse, ExecutionResult } from './types/execution.types';
import { ExecutionErrors, ExecutionConfig } from './constants/execution.constants';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly nflowService: any, // TODO: Update this to the actual NflowService
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Execute API calls against the Nflow platform with retry mechanism
   * @param params Parameters for API call execution
   * @returns Execution results including resource IDs and URLs
   */
  async executeApiCall(params: ExecuteApiCallParams): Promise<ExecutionResponse> {
    const maxRetries = params.maxRetries ?? ExecutionConfig.DEFAULT_MAX_RETRIES;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        const result = await this.makeApiCall(params);
        await this.logExecution(params, result, retryCount);
        return { results: [result] };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`API call failed (attempt ${retryCount + 1}/${maxRetries + 1})`, error);

        if (retryCount === maxRetries) {
          break;
        }

        retryCount++;
        await this.delay(ExecutionConfig.RETRY_DELAY_MS * retryCount);
      }
    }

    const errorResult: ExecutionResult = {
      resource: this.getResourceTypeFromEndpoint(params.apiCall.endpoint),
      id: '',
      error: lastError?.message || ExecutionErrors.MAX_RETRIES_EXCEEDED,
      retryCount,
    };

    await this.logExecution(params, errorResult, retryCount);
    return { results: [errorResult], error: errorResult.error };
  }

  /**
   * Make a single API call to the Nflow platform
   * @param params API call parameters
   * @returns Execution result
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async makeApiCall(params: ExecuteApiCallParams): Promise<ExecutionResult> {
    // TODO: Handle the actual API call with the NflowService
    // const { method, endpoint, payload } = params.apiCall;

    // const response = await this.nflowService.request({
    //   method,
    //   endpoint,
    //   data: payload,
    //   timeout: ExecutionConfig.TIMEOUT_MS,
    // });

    // if (!response?.data?.id) {
    //   throw new Error(ExecutionErrors.INVALID_RESPONSE);
    // }

    // return {
    //   resource: this.getResourceTypeFromEndpoint(endpoint),
    //   id: response.data.id,
    //   url: response.data.url,
    // };

    // TODO: Remove this mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          resource: 'app',
          id: '123',
          url: 'https://nflow.so/app/123',
        });
      }, 1000);
    });
  }

  /**
   * Log execution results to the database
   * @param params Original API call parameters
   * @param result Execution result
   * @param retryCount Number of retries performed
   */
  private async logExecution(
    params: ExecuteApiCallParams,
    result: ExecutionResult,
    retryCount: number,
  ): Promise<void> {
    try {
      await this.prisma.agentResult.create({
        data: {
          agentType: 'EXECUTION_AGENT',
          sessionId: params.sessionId,
          messageId: params.messageId,
          input: JSON.stringify(params.apiCall),
          output: JSON.stringify(result),
          status: result.error ? 'FAILED' : 'COMPLETED',
          error: result.error,
          duration: retryCount * ExecutionConfig.RETRY_DELAY_MS,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log execution result', error);
    }
  }

  /**
   * Extract resource type from API endpoint
   * @param endpoint API endpoint path
   * @returns Resource type
   */
  private getResourceTypeFromEndpoint(endpoint: string): ExecutionResult['resource'] {
    if (endpoint.includes('/apps')) return 'app';
    if (endpoint.includes('/objects')) return 'object';
    if (endpoint.includes('/layouts')) return 'layout';
    if (endpoint.includes('/flows')) return 'flow';
    return 'app'; // Default to app if unknown
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
