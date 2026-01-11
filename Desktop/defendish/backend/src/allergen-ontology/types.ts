// ============================================================================
// DEFENDISH ALLERGEN ONTOLOGY - TYPESCRIPT INTERFACES
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Type definitions for safety-critical allergen detection
// ============================================================================

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * AllergenCategory - Represents a class of allergens (e.g., PEANUT, MILK)
 * Based on FDA Big 9 + regional requirements
 */
export interface AllergenCategory {
  id: string;
  code: string;                                    // Unique code: 'PEANUT', 'MILK', 'GLUTEN'
  name: string;                                    // Display name: 'Peanuts'
  regulatoryRegion: 'GLOBAL' | 'US' | 'EU' | 'IN' | 'AU' | 'JP' | 'CA';
  isMajorAllergen: boolean;                        // Big 9 = true
  severity: 'critical' | 'high' | 'moderate';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * CanonicalIngredient - The single source of truth for ingredient identity
 * Every raw ingredient text resolves to ONE canonical entry
 */
export interface CanonicalIngredient {
  id: string;
  canonicalName: string;                           // Machine-readable: 'peanut_oil'
  displayName: string;                             // Human-readable: 'Peanut Oil'
  category?: string;                               // 'dairy', 'nut', 'grain'
  isDerivative: boolean;                           // true for 'peanut_oil' (derived from peanut)
  parentIngredientId?: string;                     // Reference to base ingredient
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  notes?: string;
}

/**
 * IngredientAllergenMap - Links ingredients to allergens
 * THIS IS THE CRITICAL SAFETY TABLE
 */
export interface IngredientAllergenMap {
  id: string;
  ingredientId: string;
  allergenId: string;
  riskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE';
  confidence: number;                              // 0.00 - 1.00
  source: string;                                  // 'FDA', 'manufacturer', 'research'
  createdAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

/**
 * IngredientSynonym - Maps variant texts to canonical ingredients
 * This is where "groundnut" → "peanut" resolution happens
 */
export interface IngredientSynonym {
  id: string;
  synonym: string;                                 // Original text
  synonymNormalized: string;                       // Lowercase, trimmed
  canonicalId: string;
  languageCode: string;                            // ISO 639-1: 'en', 'hi', 'es'
  regionCode?: string;                             // ISO 3166-1: 'IN', 'US', 'GB'
  confidence: number;
  synonymType: SynonymType;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type SynonymType = 
  | 'EXACT'           // Direct match
  | 'SPELLING'        // Alternate spelling
  | 'REGIONAL'        // Regional name
  | 'SCIENTIFIC'      // Scientific name
  | 'ABBREVIATION'    // Shortened form
  | 'TRANSLATION'     // Foreign language
  | 'BRAND';          // Brand name

/**
 * CompoundIngredient - Maps compound ingredients to constituents
 * e.g., "whey protein concentrate" → [whey, milk_protein]
 */
export interface CompoundIngredient {
  id: string;
  compoundId: string;
  containsId: string;
  isRequired: boolean;
  minPercentage?: number;
  maxPercentage?: number;
  source: string;
  createdAt: Date;
}

/**
 * RiskPhrase - Detects cross-contamination warnings
 */
export interface RiskPhrase {
  id: string;
  phrase: string;
  phraseNormalized: string;
  riskType: RiskType;
  specificAllergenId?: string;                     // NULL = applies to all
  outputRiskLevel: 'DEFINITE' | 'POSSIBLE' | 'TRACE';
  confidence: number;
  languageCode: string;
  createdAt: Date;
  isActive: boolean;
}

export type RiskType = 
  | 'CROSS_CONTAMINATION'   // "may contain traces of"
  | 'SHARED_FACILITY'       // "produced in a facility"
  | 'SHARED_EQUIPMENT'      // "made on equipment"
  | 'NOT_SUITABLE'          // "not suitable for X allergy"
  | 'CONTAINS_WARNING';     // "contains X"

// ============================================================================
// NORMALIZER INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Raw input to the normalizer
 */
export interface NormalizerInput {
  rawText: string;                                 // Raw ingredient list text
  productId?: string;                              // For audit logging
  languageHint?: string;                           // Expected language
  regionHint?: string;                             // Expected region
}

/**
 * Single normalized ingredient result
 */
export interface NormalizedIngredient {
  // Input
  originalToken: string;                           // What was parsed from raw text
  
  // Match result
  matched: boolean;
  canonicalId: string | null;
  canonicalName: string | null;
  displayName: string | null;
  
  // Match quality
  matchConfidence: number;                         // 0.00 - 1.00
  matchMethod: MatchMethod;
  matchedSynonym?: string;                         // If matched via synonym
  
  // Allergen info (denormalized for convenience)
  allergenIds: string[];
  allergenCodes: string[];
  
  // Audit
  matchPath?: string;                              // How match was found
}

export type MatchMethod = 
  | 'EXACT'           // Direct canonical name match
  | 'SYNONYM'         // Matched via synonym table
  | 'COMPOUND'        // Matched as part of compound
  | 'UNMATCHED';      // No match found

/**
 * Detected risk phrase
 */
export interface DetectedRiskPhrase {
  phrase: string;
  riskType: RiskType;
  specificAllergenId: string | null;
  specificAllergenCode: string | null;
  outputRiskLevel: 'DEFINITE' | 'POSSIBLE' | 'TRACE';
  confidence: number;
  position: number;                                // Character position in raw text
}

/**
 * Complete normalization result
 */
export interface NormalizationResult {
  // Input echo
  rawInput: string;
  
  // Token parsing
  tokensExtracted: number;
  
  // Match results
  normalized: NormalizedIngredient[];
  matched: NormalizedIngredient[];                 // Only matched ingredients
  unmatched: string[];                             // Tokens we couldn't match
  
  // Risk phrases
  riskPhrasesDetected: DetectedRiskPhrase[];
  
  // Confidence metrics
  overallConfidence: number;                       // 0.00 - 1.00
  matchRate: number;                               // matched / total tokens
  
  // Safety flags
  hasUnmatchedTokens: boolean;
  requiresManualReview: boolean;
  reviewReasons: string[];
  
  // Timing
  processingTimeMs: number;
}

// ============================================================================
// ALLERGEN DETECTOR INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Profile allergies input
 */
export interface ProfileAllergies {
  profileId: string;
  allergenIds: string[];                           // AllergenCategory IDs
  allergenCodes: string[];                         // AllergenCategory codes
}

/**
 * Single detected allergen
 */
export interface DetectedAllergen {
  // Which allergen
  allergenId: string;
  allergenCode: string;
  allergenName: string;
  
  // How it was detected
  source: AllergenSource;
  sourceDetail: string;                            // Specific ingredient or phrase
  
  // Risk classification
  riskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE';
  
  // Confidence
  confidence: number;
  
  // For explanation
  explanation: string;
}

export type AllergenSource = 
  | 'INGREDIENT'      // Direct from ingredient
  | 'DERIVATIVE'      // From derivative ingredient
  | 'COMPOUND'        // From compound ingredient
  | 'RISK_PHRASE';    // From warning text

/**
 * Complete allergen detection result
 */
export interface AllergenDetectionResult {
  // Input echo
  profileId: string;
  profileAllergenCount: number;
  
  // Detection results
  detected: DetectedAllergen[];
  
  // Categorized by risk
  definiteAllergens: DetectedAllergen[];           // DEFINITE + DERIVED
  possibleAllergens: DetectedAllergen[];           // POSSIBLE
  traceAllergens: DetectedAllergen[];              // TRACE
  
  // Summary flags
  hasDefiniteMatch: boolean;
  hasPossibleMatch: boolean;
  hasTraceMatch: boolean;
  
  // Overall assessment
  highestRiskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE' | 'NONE';
  
  // For unmatched ingredients
  unmatchedIngredientWarning: boolean;
  unmatchedIngredients: string[];
  
  // Safety recommendation (facts only, NOT UI labels)
  safetyFacts: {
    containsDefiniteAllergen: boolean;
    containsPossibleAllergen: boolean;
    hasUnknownIngredients: boolean;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// ============================================================================
// CACHE TYPES (for in-memory lookup)
// ============================================================================

/**
 * In-memory cache structure for fast lookups
 */
export interface OntologyCache {
  // Synonym → CanonicalId (lowercase key)
  synonymMap: Map<string, string>;
  
  // CanonicalId → CanonicalIngredient
  ingredientMap: Map<string, CanonicalIngredient>;
  
  // CanonicalId → AllergenIds[]
  ingredientAllergenMap: Map<string, string[]>;
  
  // AllergenId → AllergenCategory
  allergenMap: Map<string, AllergenCategory>;
  
  // AllergenCode → AllergenId
  allergenCodeMap: Map<string, string>;
  
  // CompoundId → ContainsIds[]
  compoundMap: Map<string, string[]>;
  
  // Risk phrases (sorted by length desc for greedy matching)
  riskPhrases: RiskPhrase[];
  
  // Metadata
  lastUpdated: Date;
  synonymCount: number;
  ingredientCount: number;
  allergenCount: number;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface NormalizationAuditLog {
  id: string;
  rawInput: string;
  productId?: string;
  normalizedResult: NormalizationResult;
  unmatchedTokens: string[];
  riskPhrasesFound: DetectedRiskPhrase[];
  confidenceScore: number;
  tokensProcessed: number;
  tokensMatched: number;
  processingTimeMs: number;
  createdAt: Date;
}
