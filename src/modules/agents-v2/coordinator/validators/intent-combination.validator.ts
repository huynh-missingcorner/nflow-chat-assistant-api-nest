import { Injectable } from '@nestjs/common';

import { DomainIntentCombination } from '../types/graph-state.types';

export interface IIntentCombinationValidator {
  isValidCombination(domain: string, intent: string): boolean;
  getValidCombinations(): DomainIntentCombination[];
}

@Injectable()
export class IntentCombinationValidator implements IIntentCombinationValidator {
  private readonly validCombinations: DomainIntentCombination[] = [
    // Application intents
    { domain: 'application', intent: 'create_application' },
    { domain: 'application', intent: 'delete_application' },
    { domain: 'application', intent: 'update_application' },
    // Object intents
    { domain: 'object', intent: 'create_object' },
    { domain: 'object', intent: 'delete_object' },
    { domain: 'object', intent: 'update_object_metadata' },
    { domain: 'object', intent: 'manipulate_object_fields' },
    { domain: 'object', intent: 'design_data_schema' },
    // Layout intents
    { domain: 'layout', intent: 'create_layout' },
    { domain: 'layout', intent: 'delete_layout' },
    { domain: 'layout', intent: 'update_layout' },
    // Flow intents
    { domain: 'flow', intent: 'create_flow' },
    { domain: 'flow', intent: 'delete_flow' },
    { domain: 'flow', intent: 'update_flow' },
  ];

  isValidCombination(domain: string, intent: string): boolean {
    return this.validCombinations.some(
      (combo) => combo.domain === domain && combo.intent === intent,
    );
  }

  getValidCombinations(): DomainIntentCombination[] {
    return [...this.validCombinations];
  }
}
