// ============================================================================
// DEFENDISH ALLERGEN DETECTOR SERVICE
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Detect allergens from normalized ingredients against user profile
// Safety Principle: NEVER produce false SAFE - flag ALL uncertainty
// ============================================================================

import {
  NormalizationResult,
  NormalizedIngredient,
  DetectedRiskPhrase,
  ProfileAllergies,
  DetectedAllergen,
  AllergenDetectionResult,
  AllergenSource,
  OntologyCache,
} from './types';
import { getCache } from './ingredientNormalizer.service';

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect allergens from normalized ingredients
 * 
 * SAFETY PRINCIPLES:
 * 1. ANY match to profile allergens = flagged
 * 2. Risk phrases trigger POSSIBLE/TRACE classification
 * 3. Unmatched ingredients = warning (could contain allergens)
 * 4. NO assumptions - if uncertain, flag for review
 * 
 * @param normResult - Output from ingredientNormalizer
 * @param profileAllergies - User's allergen profile
 * @returns Detection result with categorized allergens
 */
export function detectAllergens(
  normResult: NormalizationResult,
  profileAllergies: ProfileAllergies
): AllergenDetectionResult {
  const ontology = getCache();

  const result: AllergenDetectionResult = {
    profileId: profileAllergies.profileId,
    profileAllergenCount: profileAllergies.allergenIds.length,
    detected: [],
    definiteAllergens: [],
    possibleAllergens: [],
    traceAllergens: [],
    hasDefiniteMatch: false,
    hasPossibleMatch: false,
    hasTraceMatch: false,
    highestRiskLevel: 'NONE',
    unmatchedIngredientWarning: false,
    unmatchedIngredients: [],
    safetyFacts: {
      containsDefiniteAllergen: false,
      containsPossibleAllergen: false,
      hasUnknownIngredients: false,
      confidenceLevel: 'HIGH',
    },
  };

  // If no profile allergens, return early
  if (profileAllergies.allergenIds.length === 0) {
    return result;
  }

  // Create lookup set for profile allergens
  const profileAllergenSet = new Set(profileAllergies.allergenIds);
  const profileAllergenCodeSet = new Set(profileAllergies.allergenCodes.map(c => c.toUpperCase()));

  // STEP 1: Check matched ingredients
  for (const ingredient of normResult.matched) {
    const detected = checkIngredientForAllergens(
      ingredient,
      profileAllergenSet,
      ontology
    );
    result.detected.push(...detected);
  }

  // STEP 2: Check risk phrases
  const riskPhraseAllergens = checkRiskPhrases(
    normResult.riskPhrasesDetected,
    profileAllergenSet,
    profileAllergenCodeSet,
    ontology
  );
  result.detected.push(...riskPhraseAllergens);

  // STEP 3: Categorize by risk level
  for (const allergen of result.detected) {
    switch (allergen.riskLevel) {
      case 'DEFINITE':
      case 'DERIVED':
        result.definiteAllergens.push(allergen);
        break;
      case 'POSSIBLE':
        result.possibleAllergens.push(allergen);
        break;
      case 'TRACE':
        result.traceAllergens.push(allergen);
        break;
    }
  }

  // Remove duplicates (same allergen from multiple sources - keep highest risk)
  result.definiteAllergens = deduplicateAllergens(result.definiteAllergens);
  result.possibleAllergens = deduplicateAllergens(result.possibleAllergens);
  result.traceAllergens = deduplicateAllergens(result.traceAllergens);

  // STEP 4: Set summary flags
  result.hasDefiniteMatch = result.definiteAllergens.length > 0;
  result.hasPossibleMatch = result.possibleAllergens.length > 0;
  result.hasTraceMatch = result.traceAllergens.length > 0;

  // STEP 5: Determine highest risk level
  if (result.hasDefiniteMatch) {
    result.highestRiskLevel = 'DEFINITE';
  } else if (result.hasPossibleMatch) {
    result.highestRiskLevel = 'POSSIBLE';
  } else if (result.hasTraceMatch) {
    result.highestRiskLevel = 'TRACE';
  } else {
    result.highestRiskLevel = 'NONE';
  }

  // STEP 6: Handle unmatched ingredients (SAFETY CRITICAL)
  if (normResult.unmatched.length > 0) {
    result.unmatchedIngredientWarning = true;
    result.unmatchedIngredients = normResult.unmatched;
  }

  // STEP 7: Compute safety facts
  result.safetyFacts = {
    containsDefiniteAllergen: result.hasDefiniteMatch,
    containsPossibleAllergen: result.hasPossibleMatch || result.hasTraceMatch,
    hasUnknownIngredients: result.unmatchedIngredientWarning,
    confidenceLevel: computeConfidenceLevel(normResult, result),
  };

  return result;
}

// ============================================================================
// INGREDIENT CHECKING
// ============================================================================

/**
 * Check a single normalized ingredient for allergens
 */
function checkIngredientForAllergens(
  ingredient: NormalizedIngredient,
  profileAllergenSet: Set<string>,
  ontology: OntologyCache
): DetectedAllergen[] {
  const detected: DetectedAllergen[] = [];

  for (const allergenId of ingredient.allergenIds) {
    if (profileAllergenSet.has(allergenId)) {
      const allergen = ontology.allergenMap.get(allergenId);
      if (!allergen) continue;

      // Determine risk level based on match
      let riskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE' = 'DEFINITE';
      let source: AllergenSource = 'INGREDIENT';
      
      // Check if this is a derivative
      const canonicalIngredient = ontology.ingredientMap.get(ingredient.canonicalId!);
      if (canonicalIngredient?.isDerivative) {
        riskLevel = 'DERIVED';
        source = 'DERIVATIVE';
      }

      // Check if this came from compound resolution
      if (ingredient.matchMethod === 'COMPOUND') {
        source = 'COMPOUND';
      }

      detected.push({
        allergenId,
        allergenCode: allergen.code,
        allergenName: allergen.name,
        source,
        sourceDetail: ingredient.originalToken,
        riskLevel,
        confidence: ingredient.matchConfidence,
        explanation: buildExplanation(ingredient, allergen, source, riskLevel),
      });
    }
  }

  return detected;
}

// ============================================================================
// RISK PHRASE CHECKING
// ============================================================================

/**
 * Check risk phrases for allergen implications
 */
function checkRiskPhrases(
  riskPhrases: DetectedRiskPhrase[],
  profileAllergenSet: Set<string>,
  profileAllergenCodeSet: Set<string>,
  ontology: OntologyCache
): DetectedAllergen[] {
  const detected: DetectedAllergen[] = [];

  for (const riskPhrase of riskPhrases) {
    // If phrase mentions specific allergen
    if (riskPhrase.specificAllergenId && profileAllergenSet.has(riskPhrase.specificAllergenId)) {
      const allergen = ontology.allergenMap.get(riskPhrase.specificAllergenId);
      if (allergen) {
        detected.push({
          allergenId: riskPhrase.specificAllergenId,
          allergenCode: allergen.code,
          allergenName: allergen.name,
          source: 'RISK_PHRASE',
          sourceDetail: riskPhrase.phrase,
          riskLevel: riskPhrase.outputRiskLevel,
          confidence: riskPhrase.confidence,
          explanation: `Warning phrase detected: "${riskPhrase.phrase}" indicates ${riskPhrase.riskType.toLowerCase().replace('_', ' ')} risk for ${allergen.name}.`,
        });
      }
    }
    // If phrase is generic (applies to all allergens)
    else if (!riskPhrase.specificAllergenId) {
      // Check if phrase context mentions specific allergen
      const contextAllergen = extractAllergenFromContext(riskPhrase.phrase, profileAllergenCodeSet, ontology);
      
      if (contextAllergen) {
        detected.push({
          allergenId: contextAllergen.id,
          allergenCode: contextAllergen.code,
          allergenName: contextAllergen.name,
          source: 'RISK_PHRASE',
          sourceDetail: riskPhrase.phrase,
          riskLevel: riskPhrase.outputRiskLevel,
          confidence: riskPhrase.confidence * 0.9, // Slightly lower confidence for context extraction
          explanation: `Warning phrase detected: "${riskPhrase.phrase}" may indicate exposure to ${contextAllergen.name}.`,
        });
      } else {
        // Generic warning - flag ALL profile allergens as POSSIBLE
        // This is CONSERVATIVE - better safe than sorry
        for (const allergenId of profileAllergenSet) {
          const allergen = ontology.allergenMap.get(allergenId);
          if (allergen) {
            detected.push({
              allergenId,
              allergenCode: allergen.code,
              allergenName: allergen.name,
              source: 'RISK_PHRASE',
              sourceDetail: riskPhrase.phrase,
              riskLevel: 'POSSIBLE',
              confidence: riskPhrase.confidence * 0.7, // Lower confidence for generic warnings
              explanation: `Generic warning phrase detected: "${riskPhrase.phrase}". This product may contain ${allergen.name} due to ${riskPhrase.riskType.toLowerCase().replace('_', ' ')}.`,
            });
          }
        }
      }
    }
  }

  return detected;
}

/**
 * Try to extract specific allergen from risk phrase context
 * e.g., "may contain traces of peanuts" → PEANUT
 */
function extractAllergenFromContext(
  phrase: string,
  profileAllergenCodeSet: Set<string>,
  ontology: OntologyCache
): { id: string; code: string; name: string } | null {
  const normalizedPhrase = phrase.toLowerCase();

  // Check each profile allergen
  for (const [allergenId, allergen] of ontology.allergenMap) {
    if (!profileAllergenCodeSet.has(allergen.code.toUpperCase())) continue;

    // Check if allergen name appears in phrase
    if (normalizedPhrase.includes(allergen.name.toLowerCase())) {
      return { id: allergenId, code: allergen.code, name: allergen.name };
    }

    // Check common variants
    const variants = getAllergenNameVariants(allergen.code);
    for (const variant of variants) {
      if (normalizedPhrase.includes(variant)) {
        return { id: allergenId, code: allergen.code, name: allergen.name };
      }
    }
  }

  return null;
}

/**
 * Get common name variants for an allergen code
 */
function getAllergenNameVariants(code: string): string[] {
  const variants: Record<string, string[]> = {
    'PEANUT': ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
    'TREE_NUTS': ['nuts', 'tree nuts', 'nut'],
    'MILK': ['milk', 'dairy', 'lactose'],
    'EGG': ['egg', 'eggs'],
    'WHEAT': ['wheat', 'gluten'],
    'SOY': ['soy', 'soya', 'soybean'],
    'FISH': ['fish'],
    'SHELLFISH': ['shellfish', 'crustacean', 'mollusc'],
    'SESAME': ['sesame'],
  };

  return variants[code] || [code.toLowerCase()];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build human-readable explanation for detected allergen
 */
function buildExplanation(
  ingredient: NormalizedIngredient,
  allergen: { code: string; name: string },
  source: AllergenSource,
  riskLevel: string
): string {
  const ingredientName = ingredient.displayName || ingredient.originalToken;

  switch (source) {
    case 'INGREDIENT':
      return `"${ingredientName}" contains ${allergen.name}. This is a ${riskLevel.toLowerCase()} allergen match.`;
    
    case 'DERIVATIVE':
      return `"${ingredientName}" is derived from a ${allergen.name} source. Cross-reactivity may occur.`;
    
    case 'COMPOUND':
      return `"${ingredientName}" is a compound ingredient that contains ${allergen.name}.`;
    
    default:
      return `${allergen.name} detected in "${ingredientName}".`;
  }
}

/**
 * Remove duplicate allergen detections (keep highest risk)
 */
function deduplicateAllergens(allergens: DetectedAllergen[]): DetectedAllergen[] {
  const byAllergenId = new Map<string, DetectedAllergen>();

  for (const allergen of allergens) {
    const existing = byAllergenId.get(allergen.allergenId);
    
    if (!existing) {
      byAllergenId.set(allergen.allergenId, allergen);
    } else {
      // Keep the one with higher confidence
      if (allergen.confidence > existing.confidence) {
        byAllergenId.set(allergen.allergenId, allergen);
      }
    }
  }

  return Array.from(byAllergenId.values());
}

/**
 * Compute overall confidence level
 */
function computeConfidenceLevel(
  normResult: NormalizationResult,
  detectionResult: AllergenDetectionResult
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // Start with normalization confidence
  let confidence = normResult.overallConfidence;

  // Penalize for unmatched ingredients
  if (detectionResult.unmatchedIngredientWarning) {
    confidence *= 0.7;
  }

  // Penalize for risk phrases (uncertainty)
  if (normResult.riskPhrasesDetected.length > 0) {
    confidence *= 0.8;
  }

  if (confidence >= 0.8) return 'HIGH';
  if (confidence >= 0.5) return 'MEDIUM';
  return 'LOW';
}

// ============================================================================
// SAFETY VERDICT (FACTS ONLY - NOT UI LABELS)
// ============================================================================

/**
 * Generate safety verdict facts
 * 
 * NOTE: This outputs FACTS, not UI labels.
 * The UI layer (UX Honesty Layer) translates facts to SAFE/AVOID/VERIFY.
 * 
 * SAFETY RULE: If ANY of these are true, the product is NOT definitively safe:
 * - containsDefiniteAllergen
 * - containsPossibleAllergen  
 * - hasUnknownIngredients
 * - confidenceLevel !== 'HIGH'
 */
export function generateSafetyVerdict(
  detectionResult: AllergenDetectionResult
): {
  isDefinitivelySafe: boolean;
  isDefinitelyUnsafe: boolean;
  requiresVerification: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isDefinitivelySafe = true;
  let isDefinitelyUnsafe = false;

  // RULE 1: Definite allergen = UNSAFE
  if (detectionResult.safetyFacts.containsDefiniteAllergen) {
    isDefinitivelySafe = false;
    isDefinitelyUnsafe = true;
    reasons.push(`Contains ${detectionResult.definiteAllergens.map(a => a.allergenName).join(', ')}`);
  }

  // RULE 2: Possible allergen = NOT SAFE (but not definitely unsafe)
  if (detectionResult.safetyFacts.containsPossibleAllergen) {
    isDefinitivelySafe = false;
    reasons.push('May contain allergens (cross-contamination risk)');
  }

  // RULE 3: Unknown ingredients = NOT SAFE
  if (detectionResult.safetyFacts.hasUnknownIngredients) {
    isDefinitivelySafe = false;
    reasons.push(`${detectionResult.unmatchedIngredients.length} ingredient(s) could not be verified`);
  }

  // RULE 4: Low confidence = NOT SAFE
  if (detectionResult.safetyFacts.confidenceLevel !== 'HIGH') {
    isDefinitivelySafe = false;
    reasons.push(`Analysis confidence is ${detectionResult.safetyFacts.confidenceLevel}`);
  }

  return {
    isDefinitivelySafe,
    isDefinitelyUnsafe,
    requiresVerification: !isDefinitivelySafe && !isDefinitelyUnsafe,
    reasons,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  checkIngredientForAllergens,
  checkRiskPhrases,
  extractAllergenFromContext,
  deduplicateAllergens,
  computeConfidenceLevel,
};
