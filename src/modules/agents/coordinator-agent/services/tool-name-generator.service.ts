/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { ToolCall, ToolCallArguments } from '../types';

@Injectable()
export class ToolNameGeneratorService {
  private readonly logger = new Logger(ToolNameGeneratorService.name);

  /**
   * Add unique names to tool calls
   * @param _toolCalls The tool calls to process
   * @returns The name mapping from original to unique names
   */
  public processToolCallNames(_toolCalls: ToolCall[]): Map<string, string> {
    const nameMap = new Map<string, string>();

    // for (const call of toolCalls) {
    //   this.processToolCall(call, nameMap);
    // }

    return nameMap;
  }

  // private processToolCall(call: ToolCall, nameMap: Map<string, string>): void {
  //   const { functionName, arguments: toolArgs } = call.toolCall;

  //   if (functionName === 'ApiAppBuilderController_createApp' && toolArgs.name) {
  //     toolArgs.name = this.generateUniqueNameWithTimestamp(toolArgs.name);
  //   } else if (functionName === 'ApiLayoutBuilderController_createLayout' && toolArgs.name) {
  //     toolArgs.name = this.generateUniqueNameWithTimestamp(toolArgs.name);
  //   } else if (functionName === 'ApiFlowController_createFlow' && toolArgs.name) {
  //     toolArgs.name = this.generateUniqueNameWithTimestamp(toolArgs.name);
  //   } else if (functionName === 'ObjectController_changeObject' && toolArgs.data) {
  //     this.processObjectChange(toolArgs, nameMap);
  //   } else if (functionName === 'FieldController_changeField') {
  //     this.processFieldChange(toolArgs, nameMap);
  //   }
  // }

  private processObjectChange(args: ToolCallArguments, nameMap: Map<string, string>): void {
    if (!args.data) {
      return;
    }

    const originalName: string = args.data.name;
    const uniqueName = this.generateUniqueNameWithTimestamp(originalName);
    args.data.name = uniqueName;
    nameMap.set(originalName, uniqueName);

    if (args.data.relationships) {
      for (const rel of args.data.relationships) {
        rel.targetObject =
          nameMap.get(rel.targetObject) || this.generateUniqueNameWithTimestamp(rel.targetObject);
      }
    }
  }

  private processFieldChange(args: ToolCallArguments, nameMap: Map<string, string>): void {
    if (!args.objName) {
      return;
    }

    const objName = args.objName;
    if (objName && nameMap.has(objName)) {
      args.objName = nameMap.get(objName)!;
    }
  }

  /**
   * Generates a unique name with timestamp
   * @param name The original name
   * @returns A unique name with timestamp appended
   */
  private generateUniqueNameWithTimestamp(name: string): string {
    return `${name.toLowerCase()}${Date.now()}`.replace(/[^a-z0-9_]/g, '_');
  }
}
