import { Injectable } from '@nestjs/common';

import {
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import {
  ApplicationExecutionResult,
  ApplicationStateType,
} from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class AppExecutorNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.APP_EXECUTOR;
  }

  async execute(state: ApplicationStateType): Promise<Partial<ApplicationStateType>> {
    try {
      this.logger.log('Starting application execution');

      if (!state.enrichedSpec) {
        throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': enrichedSpec');
      }

      // Execute the application creation
      const executionResult = await this.executeApplication(state.enrichedSpec);

      this.logger.log(APPLICATION_LOG_MESSAGES.EXECUTION_COMPLETED);

      return this.createSuccessResult({
        executionResult,
        isCompleted: true,
      });
    } catch (error) {
      this.logger.error('Error in application execution:', error);
      return this.handleError(error, 'AppExecutorNode');
    }
  }

  private async executeApplication(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
  ): Promise<ApplicationExecutionResult> {
    try {
      // Step 1: Create the main application
      const appId = await this.createMainApplication(enrichedSpec);

      // Step 2: Create objects if any
      const objectIds = await this.createObjects(enrichedSpec, appId);

      // Step 3: Create layouts if any
      const layoutIds = await this.createLayouts(enrichedSpec, appId);

      // Step 4: Create flows if any
      const flowIds = await this.createFlows(enrichedSpec, appId);

      return {
        appId,
        objectIds,
        layoutIds,
        flowIds,
        status: 'success',
      };
    } catch (error) {
      this.logger.error('Application execution failed:', error);

      return {
        appId: enrichedSpec.appId || '',
        objectIds: [],
        layoutIds: [],
        flowIds: [],
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown execution error'],
      };
    }
  }

  private async createMainApplication(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
  ): Promise<string> {
    // TODO: Implement actual Nflow API call
    // This would call the existing CreateNewApplicationTool or make direct API calls

    this.logger.log(`Creating application: ${enrichedSpec.appName}`);

    // Simulate application creation
    await this.simulateApiCall(1000);

    return enrichedSpec.appId || `app_${Date.now()}`;
  }

  private async createObjects(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    appId: string,
  ): Promise<string[]> {
    if (!enrichedSpec.objects || enrichedSpec.objects.length === 0) {
      return [];
    }

    this.logger.log(`Creating ${enrichedSpec.objects.length} objects for app ${appId}`);

    const objectIds: string[] = [];

    for (const [index, objectName] of enrichedSpec.objects.entries()) {
      try {
        // TODO: Implement actual object creation via Nflow API
        // This would integrate with the object domain agents

        this.logger.log(`Creating object: ${objectName}`);
        await this.simulateApiCall(500);

        const objectId =
          enrichedSpec.objectIds?.[index] || `obj_${objectName.toLowerCase()}_${Date.now()}`;
        objectIds.push(objectId);
      } catch (error) {
        this.logger.error(`Failed to create object ${objectName}:`, error);
        // Continue with other objects
      }
    }

    return objectIds;
  }

  private async createLayouts(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    appId: string,
  ): Promise<string[]> {
    if (!enrichedSpec.layouts || enrichedSpec.layouts.length === 0) {
      return [];
    }

    this.logger.log(`Creating ${enrichedSpec.layouts.length} layouts for app ${appId}`);

    const layoutIds: string[] = [];

    for (const [index, layoutName] of enrichedSpec.layouts.entries()) {
      try {
        // TODO: Implement actual layout creation via Nflow API
        // This would integrate with the layout domain agents

        this.logger.log(`Creating layout: ${layoutName}`);
        await this.simulateApiCall(300);

        const layoutId =
          enrichedSpec.layoutIds?.[index] || `layout_${layoutName.toLowerCase()}_${Date.now()}`;
        layoutIds.push(layoutId);
      } catch (error) {
        this.logger.error(`Failed to create layout ${layoutName}:`, error);
        // Continue with other layouts
      }
    }

    return layoutIds;
  }

  private async createFlows(
    enrichedSpec: NonNullable<ApplicationStateType['enrichedSpec']>,
    appId: string,
  ): Promise<string[]> {
    if (!enrichedSpec.flows || enrichedSpec.flows.length === 0) {
      return [];
    }

    this.logger.log(`Creating ${enrichedSpec.flows.length} flows for app ${appId}`);

    const flowIds: string[] = [];

    for (const [index, flowName] of enrichedSpec.flows.entries()) {
      try {
        // TODO: Implement actual flow creation via Nflow API
        // This would integrate with the flow domain agents

        this.logger.log(`Creating flow: ${flowName}`);
        await this.simulateApiCall(400);

        const flowId =
          enrichedSpec.flowIds?.[index] || `flow_${flowName.toLowerCase()}_${Date.now()}`;
        flowIds.push(flowId);
      } catch (error) {
        this.logger.error(`Failed to create flow ${flowName}:`, error);
        // Continue with other flows
      }
    }

    return flowIds;
  }

  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
