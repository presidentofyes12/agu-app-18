// src/utils/legalFramework.ts
export const getLegalStateName = (level: number): string => {
  if (level < 8.33) return 'Foundation Layer';
  if (level < 16.67) return 'Authority Layer';
  if (level < 25.00) return 'Domain Layer';
  if (level < 50.00) return 'Integration Layer';
  return 'Unified Fields';
};

interface Requirement {
    type: string;
    threshold: number;
    current: number;
    description?: string;
    achieved?: boolean;
}

export const mapCapabilities = (level: number): string[] => {
  const capabilities: string[] = [];
  
  // Foundation capabilities
  if (level >= 0.93) capabilities.push('Basic Rights');
  if (level >= 3.70) capabilities.push('Power State');
  if (level >= 6.48) capabilities.push('Formation State');
  
  // Authority capabilities
  if (level >= 8.33) capabilities.push('Authority Rights');
  if (level >= 13.89) capabilities.push('Governance');
  if (level >= 15.74) capabilities.push('Full Authority');
  
  // Continue mapping other capabilities...
  
  return capabilities;
};

export const getNextStateRequirements = (level: number): Requirement[] => {
  // Return requirements based on current level
  return [
    {
      type: 'participation',
      threshold: 100,
      current: 75,
      description: 'Governance Participation',
      achieved: false
    },
    // Add other requirements...
  ];
};
