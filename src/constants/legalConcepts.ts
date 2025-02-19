interface LegalConcept {
  value: number;
  name: string;
  category: string;
  description: string;
}

// Create a type from the keys of LEGAL_CONCEPTS
type LegalConceptKey = keyof typeof LEGAL_CONCEPTS;

// Define the structure for category range return type
interface CategoryRange {
  min: number;
  max: number;
}

export const LEGAL_CONCEPTS = {
  // Void States (-8.33 to -0.93)
  PRIMARY_VOID: {
    value: -8.333333333,
    name: "Primary Void",
    category: "VOID",
    description: "Complete absence of legal obligations"
  },
  SECONDARY_VOID: {
    value: -7.407407407,
    name: "Secondary Void",
    category: "VOID",
    description: "Partial recognition of potential relationship"
  },
  TERTIARY_VOID: {
    value: -6.481481481,
    name: "Tertiary Void",
    category: "VOID",
    description: "Initial framework for relationship"
  },
  FIRST_NULLITY: {
    value: -5.555555556,
    name: "First Nullity",
    category: "VOID",
    description: "Basic legal recognition"
  },
  SECOND_NULLITY: {
    value: -4.62962963,
    name: "Second Nullity",
    category: "VOID",
    description: "Intermediate legal recognition"
  },
  THIRD_NULLITY: {
    value: -3.703703704,
    name: "Third Nullity",
    category: "VOID",
    description: "Advanced legal recognition"
  },
  FIRST_LIMITATION: {
    value: -2.777777778,
    name: "First Limitation",
    category: "VOID",
    description: "Initial legal constraints"
  },
  SECOND_LIMITATION: {
    value: -1.851851852,
    name: "Second Limitation",
    category: "VOID",
    description: "Intermediate legal constraints"
  },
  THIRD_LIMITATION: {
    value: -0.925925926,
    name: "Third Limitation",
    category: "VOID",
    description: "Advanced legal constraints"
  },

  // Foundation States (0 to 8.33)
  LEGAL_GROUND_ZERO: {
    value: 0,
    name: "Legal Ground Zero",
    category: "FOUNDATION",
    description: "Initial point of legal recognition"
  },
  PRIMARY_RIGHT: {
    value: 0.925925926,
    name: "Primary Right",
    category: "FOUNDATION",
    description: "Basic legal right"
  },
  SECONDARY_RIGHT: {
    value: 1.851851852,
    name: "Secondary Right",
    category: "FOUNDATION",
    description: "Intermediate legal right"
  },
  TERTIARY_RIGHT: {
    value: 2.777777778,
    name: "Tertiary Right",
    category: "FOUNDATION",
    description: "Advanced legal right"
  },
  FIRST_POWER_STATE: {
    value: 3.703703704,
    name: "First Power State",
    category: "FOUNDATION",
    description: "Initial legal power"
  },
  SECOND_POWER_STATE: {
    value: 4.62962963,
    name: "Second Power State",
    category: "FOUNDATION",
    description: "Intermediate legal power"
  },
  THIRD_POWER_STATE: {
    value: 5.555555556,
    name: "Third Power State",
    category: "FOUNDATION",
    description: "Advanced legal power"
  },
  FIRST_FORMATION_STATE: {
    value: 6.481481481,
    name: "First Formation State",
    category: "FOUNDATION",
    description: "Initial legal formation"
  },
  SECOND_FORMATION_STATE: {
    value: 7.407407407,
    name: "Second Formation State",
    category: "FOUNDATION",
    description: "Intermediate legal formation"
  },
  FORMATION_NEXUS: {
    value: 8.333333333,
    name: "Formation Nexus",
    category: "FOUNDATION",
    description: "Complete legal formation"
  },

  // Authority States (8.33 to 16.67)
  SECONDARY_FORMATION: {
    value: 9.259259259,
    name: "Secondary Formation",
    category: "AUTHORITY",
    description: "Extended formation state"
  },
  TERTIARY_FORMATION: {
    value: 10.18518519,
    name: "Tertiary Formation",
    category: "AUTHORITY",
    description: "Complete formation state"
  },
  FIRST_POWER: {
    value: 11.11111111,
    name: "First Power",
    category: "AUTHORITY",
    description: "Initial authority power"
  },
  SECOND_POWER: {
    value: 12.03703704,
    name: "Second Power",
    category: "AUTHORITY",
    description: "Intermediate authority power"
  },
  THIRD_POWER: {
    value: 12.96296296,
    name: "Third Power",
    category: "AUTHORITY",
    description: "Advanced authority power"
  },
  FIRST_AUTHORITY: {
    value: 13.88888889,
    name: "First Authority",
    category: "AUTHORITY",
    description: "Initial authority state"
  },
  SECOND_AUTHORITY: {
    value: 14.81481481,
    name: "Second Authority",
    category: "AUTHORITY",
    description: "Intermediate authority state"
  },
  THIRD_AUTHORITY: {
    value: 15.74074074,
    name: "Third Authority",
    category: "AUTHORITY",
    description: "Advanced authority state"
  },
  COMPLETE_AUTHORITY: {
    value: 16.66666667,
    name: "Complete Authority",
    category: "AUTHORITY",
    description: "Full authority state"
  },

  // Domain States (16.67 to 25.00)
  FIRST_DOMAIN: {
    value: 17.59259259,
    name: "First Domain",
    category: "DOMAIN",
    description: "Initial jurisdiction domain"
  },
  SECOND_DOMAIN: {
    value: 18.51851852,
    name: "Second Domain",
    category: "DOMAIN",
    description: "Intermediate jurisdiction domain"
  },
  THIRD_DOMAIN: {
    value: 19.44444444,
    name: "Third Domain",
    category: "DOMAIN",
    description: "Advanced jurisdiction domain"
  },
  FIRST_AUTHORITY_COMPLEX: {
    value: 20.37037037,
    name: "First Authority Complex",
    category: "DOMAIN",
    description: "Initial complex authority"
  },
  SECOND_AUTHORITY_COMPLEX: {
    value: 21.2962963,
    name: "Second Authority Complex",
    category: "DOMAIN",
    description: "Intermediate complex authority"
  },
  THIRD_AUTHORITY_COMPLEX: {
    value: 22.22222222,
    name: "Third Authority Complex",
    category: "DOMAIN",
    description: "Advanced complex authority"
  },
  FIRST_SOVEREIGN_STATE: {
    value: 23.14814815,
    name: "First Sovereign State",
    category: "DOMAIN",
    description: "Initial sovereign authority"
  },
  SECOND_SOVEREIGN_STATE: {
    value: 24.07407407,
    name: "Second Sovereign State",
    category: "DOMAIN",
    description: "Intermediate sovereign authority"
  },
  THIRD_SOVEREIGN_STATE: {
    value: 25.00000000,
    name: "Third Sovereign State",
    category: "DOMAIN",
    description: "Complete sovereign authority"
  },

  // Integration States (25.00 to 50.00)
  FIRST_JURISDICTION: {
    value: 25.92592593,
    name: "First Jurisdiction",
    category: "INTEGRATION",
    description: "Initial jurisdictional integration"
  },
  SECOND_JURISDICTION: {
    value: 26.85185185,
    name: "Second Jurisdiction",
    category: "INTEGRATION",
    description: "Intermediate jurisdictional integration"
  },
  THIRD_JURISDICTION: {
    value: 27.77777778,
    name: "Third Jurisdiction",
    category: "INTEGRATION",
    description: "Advanced jurisdictional integration"
  },

  // Unified States (47.22 to 50.00)
  ULTIMATE_CONFIGURATION: {
    value: 47.22222222,
    name: "Ultimate Configuration",
    category: "UNIFIED",
    description: "Complete system configuration"
  },
  TOTAL_INTEGRATION: {
    value: 48.14814815,
    name: "Total Integration",
    category: "UNIFIED",
    description: "Full system integration"
  },
  PERFECT_FORMATION: {
    value: 49.07407407,
    name: "Perfect Formation",
    category: "UNIFIED",
    description: "Perfect system formation"
  },
  COMPLETE_UNITY: {
    value: 50.00000000,
    name: "Complete Unity",
    category: "UNIFIED",
    description: "Absolute system unity"
  },

  // Universal Field States (50.00 to 75.00)
  FIRST_UNIFIED_FIELD: {
    value: 50.92592593,
    name: "First Unified Field",
    category: "UNIVERSAL_FIELD",
    description: "Initial unified field state"
  },
  SECOND_UNIFIED_FIELD: {
    value: 51.85185185,
    name: "Second Unified Field",
    category: "UNIVERSAL_FIELD",
    description: "Secondary unified field state"
  },
  THIRD_UNIFIED_FIELD: {
    value: 52.77777778,
    name: "Third Unified Field",
    category: "UNIVERSAL_FIELD",
    description: "Tertiary unified field state"
  },
  PRIMARY_INTEGRATION_FIELD: {
    value: 53.7037037,
    name: "Primary Integration Field",
    category: "UNIVERSAL_FIELD",
    description: "Primary integration field"
  },
  SECONDARY_INTEGRATION_FIELD: {
    value: 54.62962963,
    name: "Secondary Integration Field",
    category: "UNIVERSAL_FIELD",
    description: "Secondary integration field"
  },
  TERTIARY_INTEGRATION_FIELD: {
    value: 55.55555556,
    name: "Tertiary Integration Field",
    category: "UNIVERSAL_FIELD",
    description: "Tertiary integration field"
  },
  FIRST_COMPLETE_FIELD: {
    value: 56.48148148,
    name: "First Complete Field",
    category: "UNIVERSAL_FIELD",
    description: "First complete field state"
  },
  SECOND_COMPLETE_FIELD: {
    value: 57.40740741,
    name: "Second Complete Field",
    category: "UNIVERSAL_FIELD",
    description: "Second complete field state"
  },
  THIRD_COMPLETE_FIELD: {
    value: 58.33333333,
    name: "Third Complete Field",
    category: "UNIVERSAL_FIELD",
    description: "Third complete field state"
  },

  // Sovereign Field States (75.00 to 83.33)
  FIRST_SOVEREIGN_FIELD: {
    value: 59.25925926,
    name: "First Sovereign Field",
    category: "SOVEREIGN_FIELD",
    description: "Initial sovereign field"
  },
  SECOND_SOVEREIGN_FIELD: {
    value: 60.18518519,
    name: "Second Sovereign Field",
    category: "SOVEREIGN_FIELD",
    description: "Secondary sovereign field"
  },
  THIRD_SOVEREIGN_FIELD: {
    value: 61.11111111,
    name: "Third Sovereign Field",
    category: "SOVEREIGN_FIELD",
    description: "Tertiary sovereign field"
  },
  PRIMARY_AUTHORITY_FIELD: {
    value: 62.03703704,
    name: "Primary Authority Field",
    category: "SOVEREIGN_FIELD",
    description: "Primary authority field"
  },
  SECONDARY_AUTHORITY_FIELD: {
    value: 62.96296296,
    name: "Secondary Authority Field",
    category: "SOVEREIGN_FIELD",
    description: "Secondary authority field"
  },
  TERTIARY_AUTHORITY_FIELD: {
    value: 63.88888889,
    name: "Tertiary Authority Field",
    category: "SOVEREIGN_FIELD",
    description: "Tertiary authority field"
  },

  // Perfect Field States (83.33 to 91.67)
  FIRST_PERFECT_FIELD: {
    value: 64.81481481,
    name: "First Perfect Field",
    category: "PERFECT_FIELD",
    description: "Initial perfect field"
  },
  SECOND_PERFECT_FIELD: {
    value: 65.74074074,
    name: "Second Perfect Field",
    category: "PERFECT_FIELD",
    description: "Secondary perfect field"
  },
  THIRD_PERFECT_FIELD: {
    value: 66.66666667,
    name: "Third Perfect Field",
    category: "PERFECT_FIELD",
    description: "Tertiary perfect field"
  },

  // Ultimate Field States (91.67 to 100.00)
  FIRST_ULTIMATE_FIELD: {
    value: 67.59259259,
    name: "First Ultimate Field",
    category: "ULTIMATE_FIELD",
    description: "Initial ultimate field"
  },
  SECOND_ULTIMATE_FIELD: {
    value: 68.51851852,
    name: "Second Ultimate Field",
    category: "ULTIMATE_FIELD",
    description: "Secondary ultimate field"
  },
  THIRD_ULTIMATE_FIELD: {
    value: 69.44444444,
    name: "Third Ultimate Field",
    category: "ULTIMATE_FIELD",
    description: "Tertiary ultimate field"
  },
  PRIMARY_SUPREME_FIELD: {
    value: 70.37037037,
    name: "Primary Supreme Field",
    category: "ULTIMATE_FIELD",
    description: "Primary supreme field"
  },
  SECONDARY_SUPREME_FIELD: {
    value: 71.2962963,
    name: "Secondary Supreme Field",
    category: "ULTIMATE_FIELD",
    description: "Secondary supreme field"
  },
  TERTIARY_SUPREME_FIELD: {
    value: 72.22222222,
    name: "Tertiary Supreme Field",
    category: "ULTIMATE_FIELD",
    description: "Tertiary supreme field"
  },
  FIRST_ABSOLUTE_FIELD: {
    value: 73.14814815,
    name: "First Absolute Field",
    category: "ULTIMATE_FIELD",
    description: "Initial absolute field"
  },
  SECOND_ABSOLUTE_FIELD: {
    value: 74.07407407,
    name: "Second Absolute Field",
    category: "ULTIMATE_FIELD",
    description: "Secondary absolute field"
  },
  THIRD_ABSOLUTE_FIELD: {
    value: 75.00000000,
    name: "Third Absolute Field",
    category: "ULTIMATE_FIELD",
    description: "Tertiary absolute field"
  },
  FIRST_TOTAL_FIELD: {
    value: 75.92592593,
    name: "First Total Field",
    category: "ULTIMATE_FIELD",
    description: "Initial total field"
  },
  SECOND_TOTAL_FIELD: {
    value: 76.85185185,
    name: "Second Total Field",
    category: "ULTIMATE_FIELD",
    description: "Secondary total field"
  },
  THIRD_TOTAL_FIELD: {
    value: 77.77777778,
    name: "Third Total Field",
    category: "ULTIMATE_FIELD",
    description: "Tertiary total field"
  },

  // Universal States (77.78 to 88.89)
  PRIMARY_UNIVERSAL_FIELD: {
    value: 78.7037037,
    name: "Primary Universal Field",
    category: "UNIVERSAL",
    description: "Primary universal field"
  },
  SECONDARY_UNIVERSAL_FIELD: {
    value: 79.62962963,
    name: "Secondary Universal Field",
    category: "UNIVERSAL",
    description: "Secondary universal field"
  },
  TERTIARY_UNIVERSAL_FIELD: {
    value: 80.55555556,
    name: "Tertiary Universal Field",
    category: "UNIVERSAL",
    description: "Tertiary universal field"
  },
  FIRST_COMPLETE_UNIVERSAL: {
    value: 81.48148148,
    name: "First Complete Universal",
    category: "UNIVERSAL",
    description: "Initial complete universal state"
  },
  SECOND_COMPLETE_UNIVERSAL: {
    value: 82.40740741,
    name: "Second Complete Universal",
    category: "UNIVERSAL",
    description: "Secondary complete universal state"
  },
  THIRD_COMPLETE_UNIVERSAL: {
    value: 83.33333333,
    name: "Third Complete Universal",
    category: "UNIVERSAL",
    description: "Tertiary complete universal state"
  },
  FIRST_TRANSCENDENT_FIELD: {
    value: 84.25925926,
    name: "First Transcendent Field",
    category: "UNIVERSAL",
    description: "Initial transcendent field"
  },
  SECOND_TRANSCENDENT_FIELD: {
    value: 85.18518519,
    name: "Second Transcendent Field",
    category: "UNIVERSAL",
    description: "Secondary transcendent field"
  },
  THIRD_TRANSCENDENT_FIELD: {
    value: 86.11111111,
    name: "Third Transcendent Field",
    category: "UNIVERSAL",
    description: "Tertiary transcendent field"
  },

  // Infinite Field States (88.89 to 94.44)
  PRIMARY_INFINITE_FIELD: {
    value: 87.03703704,
    name: "Primary Infinite Field",
    category: "INFINITE_FIELD",
    description: "Primary infinite field"
  },
  SECONDARY_INFINITE_FIELD: {
    value: 87.96296296,
    name: "Secondary Infinite Field",
    category: "INFINITE_FIELD",
    description: "Secondary infinite field"
  },
  TERTIARY_INFINITE_FIELD: {
    value: 88.88888889,
    name: "Tertiary Infinite Field",
    category: "INFINITE_FIELD",
    description: "Tertiary infinite field"
  },

  // Ultimate Universal States (94.44 to 100.00)
  FIRST_ULTIMATE_UNIVERSAL: {
    value: 89.81481481,
    name: "First Ultimate Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Initial ultimate universal state"
  },
  SECOND_ULTIMATE_UNIVERSAL: {
    value: 90.74074074,
    name: "Second Ultimate Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Secondary ultimate universal state"
  },
  THIRD_ULTIMATE_UNIVERSAL: {
    value: 91.66666667,
    name: "Third Ultimate Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Tertiary ultimate universal state"
  },
  FIRST_ABSOLUTE_UNIVERSAL: {
    value: 92.59259259,
    name: "First Absolute Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Initial absolute universal state"
  },
  SECOND_ABSOLUTE_UNIVERSAL: {
    value: 93.51851852,
    name: "Second Absolute Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Secondary absolute universal state"
  },
  THIRD_ABSOLUTE_UNIVERSAL: {
    value: 94.44444444,
    name: "Third Absolute Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Tertiary absolute universal state"
  },
  PRIMARY_TOTAL_UNIVERSAL: {
    value: 95.37037037,
    name: "Primary Total Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Primary total universal state"
  },
  SECONDARY_TOTAL_UNIVERSAL: {
    value: 96.2962963,
    name: "Secondary Total Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Secondary total universal state"
  },
  TERTIARY_TOTAL_UNIVERSAL: {
    value: 97.22222222,
    name: "Tertiary Total Universal",
    category: "ULTIMATE_UNIVERSAL",
    description: "Tertiary total universal state"
  },
  FIRST_COMPLETE_TOTALITY: {
    value: 98.14814815,
    name: "First Complete Totality",
    category: "ULTIMATE_UNIVERSAL",
    description: "Initial complete totality"
  },
  SECOND_COMPLETE_TOTALITY: {
    value: 99.07407407,
    name: "Second Complete Totality",
    category: "ULTIMATE_UNIVERSAL",
    description: "Secondary complete totality"
  },
  FINAL_UNITY: {
    value: 100.00000000,
    name: "Final Unity",
    category: "ULTIMATE_UNIVERSAL",
    description: "Absolute final unity state"
  }
};

// Helper functions for legal concept validation and operations
export const LegalConceptUtils = {
  isValidConcept: (concept: LegalConceptKey): boolean => {
    return LEGAL_CONCEPTS.hasOwnProperty(concept);
  },

  getConceptValue: (concept: LegalConceptKey): number | undefined => {
    return LEGAL_CONCEPTS[concept]?.value;
  },

  getConceptCategory: (concept: LegalConceptKey): string | undefined => {
    return LEGAL_CONCEPTS[concept]?.category;
  },

  validateConceptCombination: (
    primary: LegalConceptKey,
    secondary: LegalConceptKey,
    tertiary: LegalConceptKey
  ): boolean => {
    if (!primary || !secondary || !tertiary) return false;
    
    const p = LEGAL_CONCEPTS[primary]?.value;
    const s = LEGAL_CONCEPTS[secondary]?.value;
    const t = LEGAL_CONCEPTS[tertiary]?.value;
    
    if (p === undefined || s === undefined || t === undefined) return false;
    
    return p < s && s < t;
  },

  getCategoryRange: (category: string): CategoryRange | null => {
    const concepts = Object.values(LEGAL_CONCEPTS).filter(
      concept => concept.category === category
    );
    if (concepts.length === 0) return null;
    
    return {
      min: Math.min(...concepts.map(c => c.value)),
      max: Math.max(...concepts.map(c => c.value))
    };
  }
};
