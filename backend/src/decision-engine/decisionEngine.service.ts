// ============================================================================
// DEFENDISH DECISION ENGINE - CORE IMPLEMENTATION
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Deterministic safety decisions from multi-source truth
// Safety Principle: Unknown or conflicting → NEVER assume SAFE
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  DecisionEngineInput,
  DecisionEngineOutput,
  DetectedAllergenFact,
  ExpiryStatusFact,
  IngredientAnalysisFact,
  DataConflict,
  AllergenInput,
  ExpiryInput,
  IngredientInput,
  DataSourceType,
  SourceMetadata,
  AUTHORITY_RANKING,
  MINIMUM_AUTHORITY_THRESHOLDS,
} from './types';

// ============================================================================
// MAIN DECISION FUNCTION
// ============================================================================

/**
 * Make a safety decision from multi-source inputs
 * 
 * SAFETY GUARANTEES:
 * 1. Lower authority sources NEVER override higher authority
 * 2. Unknown data → requiresManualReview = true
 * 3. Conflicts → explicitly surfaced, not silently resolved
 * 4. canConfirmSafe = false unless ALL conditions are met
 * 
 * @param input - Multi-source decision inputs
 * @returns Decision output with facts (NOT UI labels)
 */
export function makeDecision(input: DecisionEngineInput): DecisionEngineOutput {
  const decisionId = uuidv4();
  const decisionTimestamp = new Date();
  
  // Initialize output
  const output: DecisionEngineOutput = {
    allergensDetected: [],
    expiryStatus: {
      status: 'UNKNOWN',
      expiryDate: null,
      daysUntilExpiry: null,
      source: 'UNKNOWN',
      confidence: 0,
      isCalculated: false,
      requiresVerification: true,
      verificationReason: 'No expiry data provided',
    },
    ingredientAnalysis: {
      totalIngredients: 0,
      matchedIngredients: 0,
      unmatchedIngredients: 0,
      unmatchedList: [],
      primarySource: 'UNKNOWN',
      confidence: 0,
      hasUnknownIngredients: false,
      requiresVerification: true,
    },
    overallConfidence: 0,
    primaryDataAuthority: 'UNKNOWN',
    dataSources: [],
    requiresManualReview: false,
    reviewReasons: [],
    canConfirmSafe: false,
    hasDefiniteAllergen: false,
    hasPossibleAllergen: false,
    conflicts: [],
    hasUnresolvedConflicts: false,
    decisionTimestamp,
    decisionId,
    inputSnapshot: {
      profileAllergenCodes: input.profileAllergenCodes,
      ingredientSourceCount: input.ingredientInputs.length,
      expirySourceCount: input.expiryInputs.length,
      allergenInputCount: input.allergenInputs.length,
    },
  };

  // STEP 1: Process allergen inputs
  const allergenResult = processAllergenInputs(input.allergenInputs);
  output.allergensDetected = allergenResult.facts;
  output.conflicts.push(...allergenResult.conflicts);

  // STEP 2: Process expiry inputs
  const expiryResult = processExpiryInputs(input.expiryInputs);
  output.expiryStatus = expiryResult.fact;
  output.conflicts.push(...expiryResult.conflicts);

  // STEP 3: Process ingredient inputs
  const ingredientResult = processIngredientInputs(input.ingredientInputs);
  output.ingredientAnalysis = ingredientResult.fact;
  output.conflicts.push(...ingredientResult.conflicts);

  // STEP 4: Collect all data sources
  output.dataSources = collectDataSources(input);
  output.primaryDataAuthority = getHighestAuthority(output.dataSources);

  // STEP 5: Detect conflicts
  output.hasUnresolvedConflicts = output.conflicts.some(c => c.resolution === 'UNRESOLVED' || c.resolution === 'MANUAL_REQUIRED');

  // STEP 6: Calculate overall confidence
  output.overallConfidence = calculateOverallConfidence(output);

  // STEP 7: Set safety flags
  output.hasDefiniteAllergen = output.allergensDetected.some(
    a => a.riskLevel === 'DEFINITE' || a.riskLevel === 'DERIVED'
  );
  output.hasPossibleAllergen = output.allergensDetected.some(
    a => a.riskLevel === 'POSSIBLE' || a.riskLevel === 'TRACE'
  );

  // STEP 8: Determine if manual review required
  const reviewResult = determineReviewRequirement(output, input);
  output.requiresManualReview = reviewResult.required;
  output.reviewReasons = reviewResult.reasons;

  // STEP 9: Determine if can confirm safe
  output.canConfirmSafe = determineCanConfirmSafe(output);

  return output;
}

// ============================================================================
// ALLERGEN PROCESSING
// ============================================================================

interface AllergenProcessResult {
  facts: DetectedAllergenFact[];
  conflicts: DataConflict[];
}

/**
 * Process allergen inputs with authority-based deduplication
 */
function processAllergenInputs(inputs: AllergenInput[]): AllergenProcessResult {
  const conflicts: DataConflict[] = [];
  
  // Group by allergen ID
  const byAllergen = new Map<string, AllergenInput[]>();
  for (const input of inputs) {
    const existing = byAllergen.get(input.allergenId) || [];
    existing.push(input);
    byAllergen.set(input.allergenId, existing);
  }

  const facts: DetectedAllergenFact[] = [];

  for (const [allergenId, allergenInputs] of byAllergen) {
    // Sort by authority (highest first)
    const sorted = [...allergenInputs].sort((a, b) => 
      getAuthorityScore(b.metadata) - getAuthorityScore(a.metadata)
    );

    const primary = sorted[0];
    
    // Check for risk level conflicts
    const riskLevels = new Set(allergenInputs.map(a => a.riskLevel));
    if (riskLevels.size > 1) {
      // Conflict: different sources report different risk levels
      // SAFETY: Use HIGHEST risk level (most conservative)
      const highestRisk = getHighestRiskLevel(allergenInputs);
      
      conflicts.push({
        field: `allergen_${allergenId}_riskLevel`,
        conflictType: 'VALUE_MISMATCH',
        values: allergenInputs.map(a => ({
          source: a.metadata.sourceType,
          value: a.riskLevel,
          confidence: a.metadata.confidence,
          timestamp: a.metadata.timestamp,
        })),
        resolution: 'AUTO_RESOLVED',
        resolvedValue: highestRisk,
        resolutionReason: 'Used highest (most conservative) risk level for safety',
      });
    }

    facts.push({
      allergenId: primary.allergenId,
      allergenCode: primary.allergenCode,
      allergenName: primary.allergenName,
      riskLevel: getHighestRiskLevel(allergenInputs),
      primarySource: primary.metadata.sourceType,
      allSources: allergenInputs.map(a => a.metadata.sourceType),
      highestConfidence: Math.max(...allergenInputs.map(a => a.metadata.confidence)),
      sourceIngredient: primary.sourceIngredient,
      explanation: primary.explanation,
    });
  }

  return { facts, conflicts };
}

/**
 * Get the highest (most severe) risk level from inputs
 * SAFETY: Always choose most conservative option
 */
function getHighestRiskLevel(inputs: AllergenInput[]): 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE' {
  const riskOrder: Record<string, number> = {
    'DEFINITE': 4,
    'DERIVED': 3,
    'POSSIBLE': 2,
    'TRACE': 1,
  };

  let highest = 'TRACE';
  let highestScore = 0;

  for (const input of inputs) {
    const score = riskOrder[input.riskLevel] || 0;
    if (score > highestScore) {
      highestScore = score;
      highest = input.riskLevel;
    }
  }

  return highest as 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE';
}

// ============================================================================
// EXPIRY PROCESSING
// ============================================================================

interface ExpiryProcessResult {
  fact: ExpiryStatusFact;
  conflicts: DataConflict[];
}

/**
 * Process expiry inputs with authority-based resolution
 */
function processExpiryInputs(inputs: ExpiryInput[]): ExpiryProcessResult {
  const conflicts: DataConflict[] = [];

  // No expiry data
  if (inputs.length === 0) {
    return {
      fact: {
        status: 'UNKNOWN',
        expiryDate: null,
        daysUntilExpiry: null,
        source: 'UNKNOWN',
        confidence: 0,
        isCalculated: false,
        requiresVerification: true,
        verificationReason: 'No expiry date provided',
      },
      conflicts: [],
    };
  }

  // Sort by authority (highest first)
  const sorted = [...inputs].sort((a, b) => 
    getAuthorityScore(b.metadata) - getAuthorityScore(a.metadata)
  );

  // Check for conflicts between high-authority sources
  const expiryDates = inputs
    .filter(i => i.expiryDate !== null)
    .map(i => ({ date: i.expiryDate!, source: i.metadata.sourceType, confidence: i.metadata.confidence }));

  if (expiryDates.length > 1) {
    // Check if dates differ by more than 1 day
    const uniqueDates = new Set(expiryDates.map(d => d.date.toISOString().split('T')[0]));
    if (uniqueDates.size > 1) {
      const authorityDiff = getAuthorityScore(sorted[0].metadata) - getAuthorityScore(sorted[1].metadata);
      
      conflicts.push({
        field: 'expiryDate',
        conflictType: 'VALUE_MISMATCH',
        values: expiryDates.map(d => ({
          source: d.source,
          value: d.date.toISOString(),
          confidence: d.confidence,
          timestamp: new Date(),
        })),
        resolution: authorityDiff >= MINIMUM_AUTHORITY_THRESHOLDS.AUTO_RESOLVE_CONFLICT 
          ? 'AUTO_RESOLVED' 
          : 'MANUAL_REQUIRED',
        resolvedValue: sorted[0].expiryDate?.toISOString(),
        resolutionReason: authorityDiff >= MINIMUM_AUTHORITY_THRESHOLDS.AUTO_RESOLVE_CONFLICT
          ? `Used highest authority source (${sorted[0].metadata.sourceType})`
          : 'Authority difference too small for auto-resolution',
      });
    }
  }

  // Use highest authority source
  const primary = sorted[0];
  const now = new Date();
  
  let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN' = 'UNKNOWN';
  let daysUntilExpiry: number | null = null;

  if (primary.expiryDate) {
    const diffMs = primary.expiryDate.getTime() - now.getTime();
    daysUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      status = 'EXPIRED';
    } else if (daysUntilExpiry <= 7) {
      status = 'EXPIRING_SOON';
    } else {
      status = 'VALID';
    }
  }

  // Determine if verification required
  const requiresVerification = 
    primary.metadata.sourceType === 'UNKNOWN' ||
    AUTHORITY_RANKING[primary.metadata.sourceType] < MINIMUM_AUTHORITY_THRESHOLDS.TRUST_EXPIRY_DATE ||
    primary.isCalculated ||
    conflicts.some(c => c.resolution === 'MANUAL_REQUIRED');

  return {
    fact: {
      status,
      expiryDate: primary.expiryDate,
      daysUntilExpiry,
      source: primary.metadata.sourceType,
      confidence: primary.metadata.confidence,
      isCalculated: primary.isCalculated,
      requiresVerification,
      verificationReason: requiresVerification 
        ? buildExpiryVerificationReason(primary, conflicts)
        : undefined,
    },
    conflicts,
  };
}

function buildExpiryVerificationReason(input: ExpiryInput, conflicts: DataConflict[]): string {
  if (conflicts.some(c => c.resolution === 'MANUAL_REQUIRED')) {
    return 'Conflicting expiry dates from multiple sources';
  }
  if (input.isCalculated) {
    return 'Expiry date was calculated, not directly scanned';
  }
  if (AUTHORITY_RANKING[input.metadata.sourceType] < MINIMUM_AUTHORITY_THRESHOLDS.TRUST_EXPIRY_DATE) {
    return `Low confidence source (${input.metadata.sourceType})`;
  }
  return 'Verification recommended';
}

// ============================================================================
// INGREDIENT PROCESSING
// ============================================================================

interface IngredientProcessResult {
  fact: IngredientAnalysisFact;
  conflicts: DataConflict[];
}

/**
 * Process ingredient inputs with authority-based resolution
 */
function processIngredientInputs(inputs: IngredientInput[]): IngredientProcessResult {
  const conflicts: DataConflict[] = [];

  if (inputs.length === 0) {
    return {
      fact: {
        totalIngredients: 0,
        matchedIngredients: 0,
        unmatchedIngredients: 0,
        unmatchedList: [],
        primarySource: 'UNKNOWN',
        confidence: 0,
        hasUnknownIngredients: false,
        requiresVerification: true,
      },
      conflicts: [],
    };
  }

  // Sort by authority
  const sorted = [...inputs].sort((a, b) => 
    getAuthorityScore(b.metadata) - getAuthorityScore(a.metadata)
  );

  const primary = sorted[0];

  // Check for significant differences in ingredient lists
  if (inputs.length > 1) {
    const ingredientCounts = inputs.map(i => i.normalizedIngredients.length);
    const maxDiff = Math.max(...ingredientCounts) - Math.min(...ingredientCounts);
    
    if (maxDiff > 5) {
      conflicts.push({
        field: 'ingredientCount',
        conflictType: 'VALUE_MISMATCH',
        values: inputs.map(i => ({
          source: i.metadata.sourceType,
          value: i.normalizedIngredients.length,
          confidence: i.metadata.confidence,
          timestamp: i.metadata.timestamp,
        })),
        resolution: 'MANUAL_REQUIRED',
        resolutionReason: 'Significant difference in ingredient counts between sources',
      });
    }
  }

  const hasUnknownIngredients = primary.unmatchedCount > 0;
  const requiresVerification = 
    hasUnknownIngredients ||
    AUTHORITY_RANKING[primary.metadata.sourceType] < MINIMUM_AUTHORITY_THRESHOLDS.TRUST_INGREDIENTS ||
    conflicts.some(c => c.resolution === 'MANUAL_REQUIRED');

  return {
    fact: {
      totalIngredients: primary.normalizedIngredients.length + primary.unmatchedCount,
      matchedIngredients: primary.normalizedIngredients.length,
      unmatchedIngredients: primary.unmatchedCount,
      unmatchedList: [], // Would need to be passed through
      primarySource: primary.metadata.sourceType,
      confidence: primary.matchConfidence,
      hasUnknownIngredients,
      requiresVerification,
    },
    conflicts,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authority score for a source
 */
function getAuthorityScore(metadata: SourceMetadata): number {
  const baseScore = AUTHORITY_RANKING[metadata.sourceType] || 0;
  // Weight by confidence
  return baseScore * metadata.confidence;
}

/**
 * Get highest authority from source list
 */
function getHighestAuthority(sources: DataSourceType[]): DataSourceType {
  if (sources.length === 0) return 'UNKNOWN';
  
  return sources.reduce((highest, current) => 
    AUTHORITY_RANKING[current] > AUTHORITY_RANKING[highest] ? current : highest
  );
}

/**
 * Collect all unique data sources from input
 */
function collectDataSources(input: DecisionEngineInput): DataSourceType[] {
  const sources = new Set<DataSourceType>();
  
  input.allergenInputs.forEach(a => sources.add(a.metadata.sourceType));
  input.expiryInputs.forEach(e => sources.add(e.metadata.sourceType));
  input.ingredientInputs.forEach(i => sources.add(i.metadata.sourceType));
  
  return Array.from(sources);
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(output: DecisionEngineOutput): number {
  let confidence = 1.0;

  // Factor 1: Primary data authority
  const authorityFactor = AUTHORITY_RANKING[output.primaryDataAuthority] / 100;
  confidence *= authorityFactor;

  // Factor 2: Ingredient confidence
  if (output.ingredientAnalysis.confidence > 0) {
    confidence *= output.ingredientAnalysis.confidence;
  } else {
    confidence *= 0.5; // Unknown ingredients reduce confidence
  }

  // Factor 3: Expiry confidence
  if (output.expiryStatus.confidence > 0) {
    confidence *= (0.5 + output.expiryStatus.confidence * 0.5); // Expiry is secondary
  }

  // Factor 4: Conflicts
  const unresolvedConflicts = output.conflicts.filter(c => c.resolution !== 'AUTO_RESOLVED').length;
  confidence *= Math.pow(0.9, unresolvedConflicts);

  // Factor 5: Unknown ingredients
  if (output.ingredientAnalysis.hasUnknownIngredients) {
    confidence *= 0.7;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Determine if manual review is required
 */
function determineReviewRequirement(
  output: DecisionEngineOutput,
  input: DecisionEngineInput
): { required: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // RULE 1: Unknown ingredients → REVIEW
  if (output.ingredientAnalysis.hasUnknownIngredients) {
    reasons.push(`${output.ingredientAnalysis.unmatchedIngredients} ingredient(s) could not be identified`);
  }

  // RULE 2: Unresolved conflicts → REVIEW
  if (output.hasUnresolvedConflicts) {
    reasons.push('Conflicting data from multiple sources');
  }

  // RULE 3: Low confidence → REVIEW
  if (output.overallConfidence < 0.6) {
    reasons.push(`Low confidence score (${Math.round(output.overallConfidence * 100)}%)`);
  }

  // RULE 4: Low authority source for allergen-critical decision → REVIEW
  if (output.allergensDetected.length === 0 && 
      AUTHORITY_RANKING[output.primaryDataAuthority] < MINIMUM_AUTHORITY_THRESHOLDS.ALLOW_SAFE_VERDICT) {
    reasons.push('Ingredient data source has insufficient authority for safety confirmation');
  }

  // RULE 5: Possible/Trace allergens → REVIEW
  if (output.hasPossibleAllergen && !output.hasDefiniteAllergen) {
    reasons.push('Possible allergen exposure detected (cross-contamination risk)');
  }

  // RULE 6: Expiry verification needed → REVIEW
  if (output.expiryStatus.requiresVerification && output.expiryStatus.status !== 'UNKNOWN') {
    reasons.push(output.expiryStatus.verificationReason || 'Expiry date needs verification');
  }

  // RULE 7: No allergen data but profile has allergens → REVIEW
  if (output.allergensDetected.length === 0 && 
      input.profileAllergenIds.length > 0 &&
      output.ingredientAnalysis.totalIngredients === 0) {
    reasons.push('No ingredient data available to check against allergies');
  }

  return {
    required: reasons.length > 0,
    reasons,
  };
}

/**
 * Determine if we can confidently confirm SAFE
 * 
 * SAFETY: This is the most critical function
 * Returns TRUE only if ALL conditions are met
 */
function determineCanConfirmSafe(output: DecisionEngineOutput): boolean {
  // RULE 1: Must have NO definite allergens
  if (output.hasDefiniteAllergen) {
    return false;
  }

  // RULE 2: Must have NO possible allergens (conservative)
  if (output.hasPossibleAllergen) {
    return false;
  }

  // RULE 3: Must NOT require manual review
  if (output.requiresManualReview) {
    return false;
  }

  // RULE 4: Must have sufficient confidence
  if (output.overallConfidence < 0.7) {
    return false;
  }

  // RULE 5: Must have sufficient data authority
  if (AUTHORITY_RANKING[output.primaryDataAuthority] < MINIMUM_AUTHORITY_THRESHOLDS.ALLOW_SAFE_VERDICT) {
    return false;
  }

  // RULE 6: Must NOT have unknown ingredients
  if (output.ingredientAnalysis.hasUnknownIngredients) {
    return false;
  }

  // RULE 7: Must NOT have unresolved conflicts
  if (output.hasUnresolvedConflicts) {
    return false;
  }

  // RULE 8: Must NOT be expired
  if (output.expiryStatus.status === 'EXPIRED') {
    return false;
  }

  // ALL conditions met - can confirm safe
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getAuthorityScore,
  getHighestAuthority,
  collectDataSources,
  calculateOverallConfidence,
  determineReviewRequirement,
  determineCanConfirmSafe,
  processAllergenInputs,
  processExpiryInputs,
  processIngredientInputs,
};
