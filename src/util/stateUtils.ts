// util/stateUtils.ts

import { SystemState, TransitionRequirements, LAYER_NAMES, LAYER_BOUNDARIES } from 'types/transition';

export const getLayerName = (level: number): string => {
  // Convert layer boundaries to array and sort in descending order
  const boundaries = Object.values(LAYER_BOUNDARIES).sort((a, b) => b - a);
  
  // Find the highest boundary that's less than or equal to the current level
  const currentBoundary = boundaries.find(boundary => level >= boundary) || 0;
  
  return LAYER_NAMES[currentBoundary];
};

export const calculateProgress = (
  currentState: SystemState,
  requirements?: TransitionRequirements
): number => {
  if (!requirements || !requirements.requirements.length) {
    return 0;
  }

  // Calculate the average progress across all requirements
  const totalProgress = requirements.requirements.reduce((sum, req) => {
    const progress = Math.min((req.currentValue / req.threshold) * 100, 100);
    return sum + progress;
  }, 0);

  return Math.floor(totalProgress / requirements.requirements.length);
};

export const formatStateLevel = (level: number): string => {
  return level.toFixed(8);
};
