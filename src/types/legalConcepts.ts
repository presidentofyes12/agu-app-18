// src/types/legalConcepts.ts

// Define the base interface for a legal concept
export interface LegalConcept {
  value: number;
  name: string;
  category: string;
  description: string;
}

// Define all possible legal concept categories
export type LegalConceptCategory =
  | 'VOID'
  | 'FOUNDATION'
  | 'AUTHORITY'
  | 'DOMAIN'
  | 'INTEGRATION'
  | 'UNIFIED'
  | 'UNIVERSAL_FIELD'
  | 'SOVEREIGN_FIELD'
  | 'PERFECT_FIELD'
  | 'ULTIMATE_FIELD'
  | 'UNIVERSAL'
  | 'INFINITE_FIELD'
  | 'ULTIMATE_UNIVERSAL';

// Export the LEGAL_CONCEPTS constant with all 108 concepts
export const LEGAL_CONCEPTS = {
  // Void States (-8.33 to -0.93)
  PRIMARY_VOID: {
    value: -8.333333333,
    name: "Primary Void",
    category: "VOID",
    description: "Complete absence of legal obligations"
  },
  // ... [Previous legal concepts implementation]
} as const;

// Create a type from the keys of LEGAL_CONCEPTS
export type LegalConceptKey = keyof typeof LEGAL_CONCEPTS;

// Define the structure for category range
export interface CategoryRange {
  min: number;
  max: number;
}

// Utility functions for legal concept operations
export const LegalConceptUtils = {
  isValidConcept: (concept: LegalConceptKey): boolean => {
    return concept in LEGAL_CONCEPTS;
  },

  getConceptValue: (concept: LegalConceptKey): number | undefined => {
    return LEGAL_CONCEPTS[concept]?.value;
  },

  getConceptCategory: (concept: LegalConceptKey): string | undefined => {
    return LEGAL_CONCEPTS[concept]?.category;
  },

  getCategoryRange: (category: LegalConceptCategory): CategoryRange => {
    const concepts = Object.values(LEGAL_CONCEPTS).filter(
      concept => concept.category === category
    );
    
    return {
      min: Math.min(...concepts.map(c => c.value)),
      max: Math.max(...concepts.map(c => c.value))
    };
  },

  validateConceptHierarchy: (
    concepts: LegalConceptKey[]
  ): boolean => {
    if (concepts.length < 2) return true;
    
    const values = concepts.map(c => LEGAL_CONCEPTS[c].value);
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) return false;
    }
    return true;
  }
};

// Type guard for legal concept categories
export function isLegalConceptCategory(category: string): category is LegalConceptCategory {
  return Object.values(LEGAL_CONCEPTS).some(concept => concept.category === category);
}
