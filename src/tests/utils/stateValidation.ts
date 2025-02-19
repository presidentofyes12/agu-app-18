// src/tests/utils/stateValidation.ts
import { expect } from 'chai';
import { LEGAL_CONCEPTS } from '../../constants/legalConcepts';

export interface StateValidationParams {
  currentLevel: number;
  targetLevel: number;
  capabilities: string[];
  metrics: Record<string, number>;
}

export async function validateStateTransition(
  params: StateValidationParams
): Promise<void> {
  // Validate level progression
  expect(params.targetLevel).to.be.gt(params.currentLevel);
  
  // Validate capability assignments
  const expectedCapabilities = Object.entries(LEGAL_CONCEPTS)
    .filter(([_, concept]) => concept.value <= params.targetLevel)
    .map(([key, _]) => key);
    
  expectedCapabilities.forEach(capability => {
    expect(params.capabilities).to.include(capability);
  });

  // Validate metric requirements
  const requiredMetrics = getRequiredMetrics(params.targetLevel);
  Object.entries(requiredMetrics).forEach(([metric, threshold]) => {
    expect(params.metrics[metric]).to.be.gte(threshold);
  });
}

function getRequiredMetrics(level: number): Record<string, number> {
  // Return minimum required metrics for given level
  const metrics: Record<string, number> = {
    participation: 0,
    reputation: 0,
    governance: 0
  };

  if (level >= 0.925925926) {
    metrics.participation = 10;
  }
  if (level >= 3.703703704) {
    metrics.reputation = 25;
    metrics.governance = 15;
  }
  // Add more metric requirements for higher levels

  return metrics;
}
