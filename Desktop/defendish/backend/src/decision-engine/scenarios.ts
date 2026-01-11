// ============================================================================
// DEFENDISH DECISION ENGINE - EXAMPLE SCENARIOS
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Document expected behavior for safety audit
// ============================================================================

import {
  DecisionEngineInput,
  DecisionEngineOutput,
  AllergenInput,
  ExpiryInput,
  IngredientInput,
} from './types';
import { makeDecision } from './decisionEngine.service';

// ============================================================================
// SCENARIO 1: DEFINITE ALLERGEN MATCH (AVOID)
// ============================================================================

/**
 * SCENARIO 1: Product contains peanuts, user is allergic to peanuts
 * 
 * Input:
 * - Barcode scan returns ingredients including "groundnut oil"
 * - User profile has PEANUT allergy
 * 
 * Expected Output:
 * - hasDefiniteAllergen: TRUE
 * - canConfirmSafe: FALSE
 * - requiresManualReview: FALSE (definite match, no ambiguity)
 * - UX Verdict: AVOID
 */
export const SCENARIO_1_DEFINITE_ALLERGEN: DecisionEngineInput = {
  productId: 'prod-001',
  productName: 'Granola Bar',
  barcode: '8901234567890',
  profileId: 'profile-001',
  profileAllergenIds: ['PEANUT_ID'],
  profileAllergenCodes: ['PEANUT'],
  allergenInputs: [
    {
      allergenId: 'PEANUT_ID',
      allergenCode: 'PEANUT',
      allergenName: 'Peanuts',
      riskLevel: 'DERIVED',
      sourceIngredient: 'groundnut oil',
      explanation: '"groundnut oil" is derived from a Peanuts source. Cross-reactivity may occur.',
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
        sourceId: '8901234567890',
      },
    },
  ],
  expiryInputs: [
    {
      expiryDate: new Date('2026-06-15'),
      manufacturingDate: new Date('2025-06-15'),
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.95,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    {
      normalizedIngredients: ['oats', 'honey', 'peanut_oil', 'sugar'],
      rawText: 'Oats, Honey, Groundnut Oil, Sugar',
      unmatchedCount: 0,
      matchConfidence: 1.0,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_1: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: true,
  hasPossibleAllergen: false,
  canConfirmSafe: false,
  requiresManualReview: false, // Clear match, no ambiguity
  overallConfidence: 0.95, // High - barcode database is trusted
  primaryDataAuthority: 'BARCODE_DATABASE',
  // allergensDetected: [{ allergenCode: 'PEANUT', riskLevel: 'DERIVED', ... }]
};

// ============================================================================
// SCENARIO 2: NO ALLERGENS BUT LOW CONFIDENCE (VERIFY)
// ============================================================================

/**
 * SCENARIO 2: OCR scan with medium confidence, no allergens detected
 * 
 * Input:
 * - OCR scan returns ingredients with 60% confidence
 * - 2 ingredients could not be matched
 * - User profile has MILK allergy
 * 
 * Expected Output:
 * - hasDefiniteAllergen: FALSE
 * - canConfirmSafe: FALSE (unknown ingredients!)
 * - requiresManualReview: TRUE
 * - UX Verdict: VERIFY
 */
export const SCENARIO_2_LOW_CONFIDENCE: DecisionEngineInput = {
  productId: 'prod-002',
  productName: 'Unknown Snack',
  barcode: undefined,
  profileId: 'profile-002',
  profileAllergenIds: ['MILK_ID'],
  profileAllergenCodes: ['MILK'],
  allergenInputs: [], // No allergens detected
  expiryInputs: [
    {
      expiryDate: new Date('2026-03-01'),
      manufacturingDate: null,
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'OCR_MEDIUM_CONFIDENCE',
        confidence: 0.55,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    {
      normalizedIngredients: ['wheat_flour', 'sugar', 'salt'],
      rawText: 'Wheat Flour, Sugar, Salt, Emulsifier (???), Flavoring',
      unmatchedCount: 2, // 2 ingredients couldn't be matched
      matchConfidence: 0.6,
      metadata: {
        sourceType: 'OCR_MEDIUM_CONFIDENCE',
        confidence: 0.6,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_2: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: false,
  hasPossibleAllergen: false,
  canConfirmSafe: false, // CRITICAL: Cannot confirm safe with unknown ingredients
  requiresManualReview: true,
  reviewReasons: [
    '2 ingredient(s) could not be identified',
    'Ingredient data source has insufficient authority for safety confirmation',
  ],
  overallConfidence: 0.35, // Low due to OCR + unmatched ingredients
  primaryDataAuthority: 'OCR_MEDIUM_CONFIDENCE',
};

// ============================================================================
// SCENARIO 3: CONFLICTING DATA SOURCES (VERIFY)
// ============================================================================

/**
 * SCENARIO 3: Barcode says no milk, OCR detects "whey" in ingredients
 * 
 * Input:
 * - Barcode database: no milk allergens
 * - OCR scan: detects "whey protein" in ingredient list
 * - User profile has MILK allergy
 * 
 * Expected Output:
 * - hasDefiniteAllergen: TRUE (use most conservative)
 * - canConfirmSafe: FALSE
 * - requiresManualReview: TRUE (conflict requires verification)
 * - conflicts: [{field: 'allergen_MILK', ...}]
 * - UX Verdict: AVOID (but flag conflict)
 */
export const SCENARIO_3_CONFLICTING_DATA: DecisionEngineInput = {
  productId: 'prod-003',
  productName: 'Protein Shake',
  barcode: '8901234567891',
  profileId: 'profile-003',
  profileAllergenIds: ['MILK_ID'],
  profileAllergenCodes: ['MILK'],
  allergenInputs: [
    // From OCR (lower authority but detected allergen)
    {
      allergenId: 'MILK_ID',
      allergenCode: 'MILK',
      allergenName: 'Milk',
      riskLevel: 'DERIVED',
      sourceIngredient: 'whey protein',
      explanation: '"whey protein" is derived from Milk',
      metadata: {
        sourceType: 'OCR_HIGH_CONFIDENCE',
        confidence: 0.85,
        timestamp: new Date(),
      },
    },
  ],
  expiryInputs: [
    {
      expiryDate: new Date('2026-08-01'),
      manufacturingDate: null,
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.95,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    // Barcode database (high authority - incomplete data)
    {
      normalizedIngredients: ['water', 'sugar', 'cocoa'],
      rawText: 'Water, Sugar, Cocoa',
      unmatchedCount: 0,
      matchConfidence: 0.98,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
    // OCR (lower authority but more complete)
    {
      normalizedIngredients: ['water', 'sugar', 'cocoa', 'whey_protein_concentrate'],
      rawText: 'Water, Sugar, Cocoa, Whey Protein Concentrate',
      unmatchedCount: 0,
      matchConfidence: 0.85,
      metadata: {
        sourceType: 'OCR_HIGH_CONFIDENCE',
        confidence: 0.85,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_3: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: true, // OCR detected milk derivative
  hasPossibleAllergen: false,
  canConfirmSafe: false,
  requiresManualReview: true, // Conflict detected
  hasUnresolvedConflicts: true,
  // Key: Even though barcode (higher authority) doesn't show milk,
  // OCR detected it, so we FLAG it (safety-first)
};

// ============================================================================
// SCENARIO 4: POSSIBLE ALLERGEN FROM RISK PHRASE (VERIFY)
// ============================================================================

/**
 * SCENARIO 4: "May contain traces of nuts" detected
 * 
 * Input:
 * - Barcode scan: no nut ingredients
 * - Risk phrase detected: "may contain traces of nuts"
 * - User profile has TREE_NUTS allergy
 * 
 * Expected Output:
 * - hasDefiniteAllergen: FALSE
 * - hasPossibleAllergen: TRUE
 * - canConfirmSafe: FALSE
 * - requiresManualReview: TRUE
 * - UX Verdict: VERIFY
 */
export const SCENARIO_4_RISK_PHRASE: DecisionEngineInput = {
  productId: 'prod-004',
  productName: 'Chocolate Cookie',
  barcode: '8901234567892',
  profileId: 'profile-004',
  profileAllergenIds: ['TREE_NUTS_ID'],
  profileAllergenCodes: ['TREE_NUTS'],
  allergenInputs: [
    {
      allergenId: 'TREE_NUTS_ID',
      allergenCode: 'TREE_NUTS',
      allergenName: 'Tree Nuts',
      riskLevel: 'TRACE', // From risk phrase
      sourceIngredient: 'may contain traces of nuts',
      explanation: 'Warning phrase detected: "may contain traces of nuts" indicates cross-contamination risk',
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.90,
        timestamp: new Date(),
      },
    },
  ],
  expiryInputs: [
    {
      expiryDate: new Date('2026-04-01'),
      manufacturingDate: null,
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.95,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    {
      normalizedIngredients: ['wheat_flour', 'sugar', 'cocoa', 'butter'],
      rawText: 'Wheat Flour, Sugar, Cocoa, Butter. May contain traces of nuts.',
      unmatchedCount: 0,
      matchConfidence: 0.98,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_4: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: false,
  hasPossibleAllergen: true, // TRACE counts as possible
  canConfirmSafe: false, // Cannot confirm safe with possible allergen
  requiresManualReview: true,
  reviewReasons: [
    'Possible allergen exposure detected (cross-contamination risk)',
  ],
};

// ============================================================================
// SCENARIO 5: SAFE - ALL CONDITIONS MET (SAFE)
// ============================================================================

/**
 * SCENARIO 5: High confidence, no allergens, no conflicts
 * 
 * Input:
 * - Barcode scan with high confidence
 * - All ingredients matched
 * - No allergens detected
 * - Valid expiry date
 * - User profile has PEANUT allergy (not in product)
 * 
 * Expected Output:
 * - hasDefiniteAllergen: FALSE
 * - hasPossibleAllergen: FALSE
 * - canConfirmSafe: TRUE
 * - requiresManualReview: FALSE
 * - UX Verdict: SAFE
 */
export const SCENARIO_5_SAFE: DecisionEngineInput = {
  productId: 'prod-005',
  productName: 'Plain Rice Crackers',
  barcode: '8901234567893',
  profileId: 'profile-005',
  profileAllergenIds: ['PEANUT_ID'],
  profileAllergenCodes: ['PEANUT'],
  allergenInputs: [], // No allergens detected
  expiryInputs: [
    {
      expiryDate: new Date('2026-12-01'),
      manufacturingDate: new Date('2025-12-01'),
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    {
      normalizedIngredients: ['rice', 'salt', 'vegetable_oil'],
      rawText: 'Rice, Salt, Vegetable Oil',
      unmatchedCount: 0,
      matchConfidence: 1.0,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.99,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_5: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: false,
  hasPossibleAllergen: false,
  canConfirmSafe: true, // ALL conditions met
  requiresManualReview: false,
  overallConfidence: 0.95, // High
  primaryDataAuthority: 'BARCODE_DATABASE',
};

// ============================================================================
// SCENARIO 6: EXPIRED PRODUCT (AVOID - expiry reason)
// ============================================================================

/**
 * SCENARIO 6: No allergens but product is expired
 * 
 * Input:
 * - Barcode scan shows expiry date in past
 * - No allergens detected
 * 
 * Expected Output:
 * - hasDefiniteAllergen: FALSE
 * - canConfirmSafe: FALSE (expired!)
 * - expiryStatus.status: EXPIRED
 * - UX Verdict: AVOID (due to expiry)
 */
export const SCENARIO_6_EXPIRED: DecisionEngineInput = {
  productId: 'prod-006',
  productName: 'Expired Yogurt',
  barcode: '8901234567894',
  profileId: 'profile-006',
  profileAllergenIds: ['PEANUT_ID'],
  profileAllergenCodes: ['PEANUT'],
  allergenInputs: [],
  expiryInputs: [
    {
      expiryDate: new Date('2025-12-01'), // In the past
      manufacturingDate: new Date('2025-06-01'),
      bestBeforeDate: null,
      isCalculated: false,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
  ],
  ingredientInputs: [
    {
      normalizedIngredients: ['milk', 'sugar', 'cultures'],
      rawText: 'Milk, Sugar, Live Cultures',
      unmatchedCount: 0,
      matchConfidence: 0.98,
      metadata: {
        sourceType: 'BARCODE_DATABASE',
        confidence: 0.98,
        timestamp: new Date(),
      },
    },
  ],
  requestTimestamp: new Date(),
  requestSource: 'SCAN',
};

export const EXPECTED_RESULT_6: Partial<DecisionEngineOutput> = {
  hasDefiniteAllergen: false,
  hasPossibleAllergen: false,
  canConfirmSafe: false, // Expired products cannot be safe
  // expiryStatus: { status: 'EXPIRED', daysUntilExpiry: -36, ... }
};

// ============================================================================
// TEST RUNNER
// ============================================================================

export function runAllScenarios(): void {
  console.log('Running Decision Engine Scenarios...\n');

  const scenarios = [
    { name: 'SCENARIO 1: Definite Allergen', input: SCENARIO_1_DEFINITE_ALLERGEN, expected: EXPECTED_RESULT_1 },
    { name: 'SCENARIO 2: Low Confidence', input: SCENARIO_2_LOW_CONFIDENCE, expected: EXPECTED_RESULT_2 },
    { name: 'SCENARIO 3: Conflicting Data', input: SCENARIO_3_CONFLICTING_DATA, expected: EXPECTED_RESULT_3 },
    { name: 'SCENARIO 4: Risk Phrase', input: SCENARIO_4_RISK_PHRASE, expected: EXPECTED_RESULT_4 },
    { name: 'SCENARIO 5: Safe', input: SCENARIO_5_SAFE, expected: EXPECTED_RESULT_5 },
    { name: 'SCENARIO 6: Expired', input: SCENARIO_6_EXPIRED, expected: EXPECTED_RESULT_6 },
  ];

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(scenario.name);
    console.log('='.repeat(60));
    
    const result = makeDecision(scenario.input);
    
    console.log(`  hasDefiniteAllergen: ${result.hasDefiniteAllergen}`);
    console.log(`  hasPossibleAllergen: ${result.hasPossibleAllergen}`);
    console.log(`  canConfirmSafe: ${result.canConfirmSafe}`);
    console.log(`  requiresManualReview: ${result.requiresManualReview}`);
    console.log(`  overallConfidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`  primaryDataAuthority: ${result.primaryDataAuthority}`);
    console.log(`  conflicts: ${result.conflicts.length}`);
    
    if (result.reviewReasons.length > 0) {
      console.log(`  reviewReasons:`);
      result.reviewReasons.forEach(r => console.log(`    - ${r}`));
    }
    
    // Derive UX verdict (what UX layer would show)
    let uxVerdict = 'UNKNOWN';
    if (result.hasDefiniteAllergen || result.expiryStatus.status === 'EXPIRED') {
      uxVerdict = 'AVOID';
    } else if (result.canConfirmSafe) {
      uxVerdict = 'SAFE';
    } else {
      uxVerdict = 'VERIFY';
    }
    
    console.log(`  \n  >>> UX VERDICT: ${uxVerdict}`);
  }
}
