// ============================================================================
// DEFENDISH UX LAYER - VERDICT DECISION SERVICE
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Translate decision engine facts into user verdicts
// Core Rule: SAFE only appears when canConfirmSafe = true
// ============================================================================

import { DecisionEngineOutput, DetectedAllergenFact, ExpiryStatusFact } from '../decision-engine/types';
import {
  UserVerdict,
  UXDecisionOutput,
  UXAction,
  ExplanationItem,
  DateOrigin,
  VERDICT_STYLES,
  VERDICT_HEADLINES,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_ICONS,
  EXPIRY_STATUS_LABELS,
  EXPIRY_STATUS_ICONS,
  DATE_ORIGIN_LABELS,
  CONFIDENCE_DESCRIPTIONS,
} from './types';

// ============================================================================
// VERDICT DECISION TABLE
// ============================================================================

/**
 * VERDICT DECISION TABLE
 * 
 * This table defines when each verdict is shown.
 * Order matters - first matching condition wins.
 * 
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ CONDITION                                           │ VERDICT │ WHY   │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │ hasDefiniteAllergen = true                          │ AVOID   │ 1     │
 * │ expiryStatus.status = 'EXPIRED'                     │ AVOID   │ 2     │
 * │ hasPossibleAllergen = true                          │ VERIFY  │ 3     │
 * │ expiryStatus.status = 'UNKNOWN'                     │ VERIFY  │ 4     │
 * │ requiresManualReview = true                         │ VERIFY  │ 5     │
 * │ hasUnresolvedConflicts = true                       │ VERIFY  │ 6     │
 * │ ingredientAnalysis.hasUnknownIngredients = true     │ VERIFY  │ 7     │
 * │ overallConfidence < 0.5                             │ VERIFY  │ 8     │
 * │ canConfirmSafe = true                               │ SAFE    │ 9     │
 * │ canConfirmSafe = false (default)                    │ VERIFY  │ 10    │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * WHY EXPLANATIONS:
 * 1. Definite allergen match - user's allergen found in ingredients
 * 2. Product has expired - safety cannot be guaranteed
 * 3. Possible allergen - "may contain" or similar detected
 * 4. Cannot verify expiry - date unknown
 * 5. System flagged for review - various uncertainty reasons
 * 6. Data sources conflict - cannot determine truth
 * 7. Unknown ingredients - cannot verify all ingredients
 * 8. Low confidence - data quality insufficient
 * 9. All checks passed - confirmed safe
 * 10. Default - if none of above, cannot confirm safe
 */

// ============================================================================
// MAIN TRANSLATION FUNCTION
// ============================================================================

/**
 * Translate decision engine output to UX decision
 * 
 * @param facts - Output from decision engine
 * @param profileName - Name of the profile (for headlines)
 * @returns UXDecisionOutput ready for mobile rendering
 */
export function translateToUX(
  facts: DecisionEngineOutput,
  profileName: string
): UXDecisionOutput {
  
  // Step 1: Determine verdict
  const verdict = determineVerdict(facts);
  
  // Step 2: Generate explanations
  const explanations = generateExplanations(facts, verdict);
  
  // Step 3: Generate blocked safe reasons
  const blockedSafeReasons = generateBlockedSafeReasons(facts);
  
  // Step 4: Determine actions
  const actions = determineActions(verdict, facts);
  
  // Step 5: Build expiry display
  const expiryInfo = buildExpiryDisplay(facts.expiryStatus);
  
  // Step 6: Build confidence display
  const confidenceLevel = getConfidenceLevel(facts.overallConfidence);
  const confidenceExplanation = getConfidenceExplanation(facts);
  
  // Step 7: Build headlines
  const headline = VERDICT_HEADLINES[verdict](profileName);
  const subheadline = generateSubheadline(verdict, facts);
  const primaryReason = generatePrimaryReason(verdict, facts);
  
  return {
    verdict,
    style: VERDICT_STYLES[verdict],
    
    headline,
    subheadline,
    
    primaryReason,
    explanations,
    blockedSafeReasons,
    
    expiryDisplay: expiryInfo.display,
    daysUntilExpiry: facts.expiryStatus.daysUntilExpiry,
    dateOrigin: expiryInfo.origin,
    
    actions,
    
    confidenceLevel,
    confidenceExplanation,
    
    timestamp: facts.decisionTimestamp,
    decisionId: facts.decisionId,
  };
}

// ============================================================================
// VERDICT DETERMINATION
// ============================================================================

/**
 * Determine the verdict based on facts
 * Implements the decision table above
 */
function determineVerdict(facts: DecisionEngineOutput): UserVerdict {
  
  // AVOID conditions (highest priority)
  if (facts.hasDefiniteAllergen) {
    return 'AVOID';
  }
  
  if (facts.expiryStatus.status === 'EXPIRED') {
    return 'AVOID';
  }
  
  // VERIFY conditions
  if (facts.hasPossibleAllergen) {
    return 'VERIFY';
  }
  
  if (facts.expiryStatus.status === 'UNKNOWN') {
    return 'VERIFY';
  }
  
  if (facts.requiresManualReview) {
    return 'VERIFY';
  }
  
  if (facts.hasUnresolvedConflicts) {
    return 'VERIFY';
  }
  
  if (facts.ingredientAnalysis.hasUnknownIngredients) {
    return 'VERIFY';
  }
  
  if (facts.overallConfidence < 0.5) {
    return 'VERIFY';
  }
  
  // SAFE condition (ONLY when canConfirmSafe is true)
  if (facts.canConfirmSafe) {
    return 'SAFE';
  }
  
  // Default: Cannot confirm safe
  return 'VERIFY';
}

// ============================================================================
// EXPLANATION GENERATION
// ============================================================================

/**
 * Generate explanation items for the verdict
 */
function generateExplanations(
  facts: DecisionEngineOutput,
  verdict: UserVerdict
): ExplanationItem[] {
  const explanations: ExplanationItem[] = [];
  
  // Allergen explanations
  for (const allergen of facts.allergensDetected) {
    explanations.push(createAllergenExplanation(allergen));
  }
  
  // Expiry explanation
  explanations.push(createExpiryExplanation(facts.expiryStatus));
  
  // Unknown ingredients explanation
  if (facts.ingredientAnalysis.hasUnknownIngredients) {
    explanations.push({
      icon: 'help-circle',
      text: `${facts.ingredientAnalysis.unmatchedIngredients} ingredient(s) not recognized`,
      detail: `Could not verify: ${facts.ingredientAnalysis.unmatchedList.slice(0, 3).join(', ')}${facts.ingredientAnalysis.unmatchedList.length > 3 ? '...' : ''}`,
      severity: 'WARNING',
      category: 'CONFIDENCE',
    });
  }
  
  // Conflict explanation
  if (facts.hasUnresolvedConflicts) {
    explanations.push({
      icon: 'git-compare',
      text: 'Data sources show different information',
      detail: 'Multiple sources provided conflicting data that needs verification',
      severity: 'WARNING',
      category: 'CONFLICT',
    });
  }
  
  // Confidence explanation (if low)
  if (facts.overallConfidence < 0.5) {
    explanations.push({
      icon: 'analytics',
      text: 'Limited data available',
      detail: 'Could not gather enough information to confirm safety',
      severity: 'WARNING',
      category: 'CONFIDENCE',
    });
  }
  
  // Success explanation (for SAFE verdict)
  if (verdict === 'SAFE') {
    explanations.push({
      icon: 'shield-checkmark',
      text: 'All ingredients verified',
      detail: `Checked ${facts.ingredientAnalysis.totalIngredients} ingredients against your allergen profile`,
      severity: 'SUCCESS',
      category: 'GENERAL',
    });
  }
  
  return explanations;
}

/**
 * Create explanation for a detected allergen
 */
function createAllergenExplanation(allergen: DetectedAllergenFact): ExplanationItem {
  const riskLabel = RISK_LEVEL_LABELS[allergen.riskLevel] || 'Contains';
  const icon = RISK_LEVEL_ICONS[allergen.riskLevel] || 'alert-circle';
  
  const severity = allergen.riskLevel === 'DEFINITE' || allergen.riskLevel === 'DERIVED'
    ? 'CRITICAL'
    : 'WARNING';
  
  return {
    icon,
    text: `${riskLabel} ${allergen.allergenName.toLowerCase()}`,
    detail: allergen.explanation,
    severity,
    category: 'ALLERGEN',
  };
}

/**
 * Create explanation for expiry status
 */
function createExpiryExplanation(expiry: ExpiryStatusFact): ExplanationItem {
  const statusLabel = EXPIRY_STATUS_LABELS[expiry.status] || 'Expiry unknown';
  const icon = EXPIRY_STATUS_ICONS[expiry.status] || 'help-circle';
  
  let text = statusLabel;
  let detail: string | null = null;
  let severity: ExplanationItem['severity'] = 'INFO';
  
  if (expiry.status === 'EXPIRED') {
    severity = 'CRITICAL';
    text = 'Past expiry date';
    if (expiry.daysUntilExpiry !== null) {
      detail = `Expired ${Math.abs(expiry.daysUntilExpiry)} day(s) ago`;
    }
  } else if (expiry.status === 'EXPIRING_SOON') {
    severity = 'WARNING';
    text = `Expires in ${expiry.daysUntilExpiry} day(s)`;
    detail = 'Consider consuming soon';
  } else if (expiry.status === 'VALID') {
    severity = 'SUCCESS';
    if (expiry.daysUntilExpiry !== null) {
      text = `${expiry.daysUntilExpiry} days until expiry`;
    }
  } else if (expiry.status === 'UNKNOWN') {
    severity = 'WARNING';
    text = 'Expiry date not verified';
    detail = 'Check the package for expiry information';
  }
  
  if (expiry.isCalculated) {
    detail = (detail ? detail + '. ' : '') + 'Date estimated from manufacturing date';
  }
  
  return {
    icon,
    text,
    detail,
    severity,
    category: 'EXPIRY',
  };
}

// ============================================================================
// BLOCKED SAFE REASONS
// ============================================================================

/**
 * Generate human-readable blocked safe reasons
 */
function generateBlockedSafeReasons(facts: DecisionEngineOutput): string[] {
  const reasons: string[] = [];
  
  if (facts.hasDefiniteAllergen) {
    const allergenNames = facts.allergensDetected
      .filter(a => a.riskLevel === 'DEFINITE' || a.riskLevel === 'DERIVED')
      .map(a => a.allergenName.toLowerCase());
    reasons.push(`Contains ${allergenNames.join(', ')}`);
  }
  
  if (facts.hasPossibleAllergen) {
    const possibleNames = facts.allergensDetected
      .filter(a => a.riskLevel === 'POSSIBLE' || a.riskLevel === 'TRACE')
      .map(a => a.allergenName.toLowerCase());
    reasons.push(`May contain ${possibleNames.join(', ')}`);
  }
  
  if (facts.expiryStatus.status === 'EXPIRED') {
    reasons.push('Product has expired');
  }
  
  if (facts.expiryStatus.status === 'UNKNOWN') {
    reasons.push('Could not verify expiry date');
  }
  
  if (facts.ingredientAnalysis.hasUnknownIngredients) {
    reasons.push(`${facts.ingredientAnalysis.unmatchedIngredients} ingredient(s) not recognized`);
  }
  
  if (facts.hasUnresolvedConflicts) {
    reasons.push('Data sources show conflicting information');
  }
  
  if (facts.overallConfidence < 0.5) {
    reasons.push('Insufficient data to confirm safety');
  }
  
  // Add review reasons from decision engine
  for (const reason of facts.reviewReasons) {
    if (!reasons.includes(reason)) {
      reasons.push(reason);
    }
  }
  
  return reasons;
}

// ============================================================================
// HEADLINE & SUBHEADLINE GENERATION
// ============================================================================

/**
 * Generate subheadline based on verdict
 */
function generateSubheadline(verdict: UserVerdict, facts: DecisionEngineOutput): string {
  switch (verdict) {
    case 'SAFE':
      return 'No allergens detected';
      
    case 'AVOID':
      if (facts.hasDefiniteAllergen) {
        const count = facts.allergensDetected.filter(
          a => a.riskLevel === 'DEFINITE' || a.riskLevel === 'DERIVED'
        ).length;
        return count === 1 ? 'Allergen detected' : `${count} allergens detected`;
      }
      if (facts.expiryStatus.status === 'EXPIRED') {
        return 'Product has expired';
      }
      return 'Safety concern detected';
      
    case 'VERIFY':
      if (facts.hasPossibleAllergen) {
        return 'Possible allergen detected';
      }
      if (facts.ingredientAnalysis.hasUnknownIngredients) {
        return 'Some ingredients not recognized';
      }
      if (facts.expiryStatus.status === 'UNKNOWN') {
        return 'Expiry date needs verification';
      }
      return 'Manual verification needed';
      
    default:
      return '';
  }
}

/**
 * Generate primary reason for verdict
 */
function generatePrimaryReason(verdict: UserVerdict, facts: DecisionEngineOutput): string {
  switch (verdict) {
    case 'SAFE':
      return `Verified ${facts.ingredientAnalysis.totalIngredients} ingredients against allergen profile`;
      
    case 'AVOID':
      if (facts.hasDefiniteAllergen) {
        const allergen = facts.allergensDetected.find(
          a => a.riskLevel === 'DEFINITE' || a.riskLevel === 'DERIVED'
        );
        if (allergen) {
          return `${allergen.sourceIngredient} contains ${allergen.allergenName.toLowerCase()}`;
        }
      }
      if (facts.expiryStatus.status === 'EXPIRED') {
        return 'This product is past its expiry date';
      }
      return 'Safety concern identified';
      
    case 'VERIFY':
      if (facts.hasPossibleAllergen) {
        const allergen = facts.allergensDetected.find(
          a => a.riskLevel === 'POSSIBLE' || a.riskLevel === 'TRACE'
        );
        if (allergen) {
          return `Package indicates it may contain ${allergen.allergenName.toLowerCase()}`;
        }
      }
      if (facts.reviewReasons.length > 0) {
        return facts.reviewReasons[0];
      }
      return 'Could not fully verify product safety';
      
    default:
      return '';
  }
}

// ============================================================================
// ACTION DETERMINATION
// ============================================================================

/**
 * Determine available actions for user
 */
function determineActions(verdict: UserVerdict, facts: DecisionEngineOutput): UXAction[] {
  const actions: UXAction[] = [];
  
  switch (verdict) {
    case 'SAFE':
      actions.push({
        label: 'View Details',
        type: 'VIEW_DETAILS',
        isPrimary: false,
        style: 'TEXT',
      });
      break;
      
    case 'AVOID':
      actions.push({
        label: 'View Details',
        type: 'VIEW_DETAILS',
        isPrimary: true,
        style: 'PRIMARY',
      });
      // Don't show "Mark Safe" for allergen detections
      if (!facts.hasDefiniteAllergen && facts.expiryStatus.status === 'EXPIRED') {
        actions.push({
          label: 'Report Issue',
          type: 'REPORT_ISSUE',
          isPrimary: false,
          style: 'TEXT',
        });
      }
      break;
      
    case 'VERIFY':
      actions.push({
        label: 'Verify Manually',
        type: 'VERIFY_MANUALLY',
        isPrimary: true,
        style: 'PRIMARY',
      });
      
      // Show Mark Safe only if no definite allergens
      if (!facts.hasDefiniteAllergen) {
        actions.push({
          label: 'I\'ve checked - it\'s safe',
          type: 'MARK_SAFE',
          isPrimary: false,
          style: 'SECONDARY',
        });
      }
      
      actions.push({
        label: 'Scan Again',
        type: 'RESCAN',
        isPrimary: false,
        style: 'TEXT',
      });
      
      if (facts.expiryStatus.status === 'UNKNOWN') {
        actions.push({
          label: 'Enter Expiry Date',
          type: 'EDIT_DATE',
          isPrimary: false,
          style: 'TEXT',
        });
      }
      break;
  }
  
  return actions;
}

// ============================================================================
// CONFIDENCE & EXPIRY HELPERS
// ============================================================================

/**
 * Convert numeric confidence to level
 */
function getConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (confidence >= 0.8) return 'HIGH';
  if (confidence >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate confidence explanation
 */
function getConfidenceExplanation(facts: DecisionEngineOutput): string {
  const level = getConfidenceLevel(facts.overallConfidence);
  
  if (level === 'HIGH') {
    return CONFIDENCE_DESCRIPTIONS.HIGH;
  }
  
  if (level === 'MEDIUM') {
    if (facts.dataSources.includes('OCR_HIGH_CONFIDENCE') || 
        facts.dataSources.includes('OCR_MEDIUM_CONFIDENCE')) {
      return 'Based on package scan - verify if unsure';
    }
    return CONFIDENCE_DESCRIPTIONS.MEDIUM;
  }
  
  return CONFIDENCE_DESCRIPTIONS.LOW;
}

/**
 * Build expiry display information
 */
function buildExpiryDisplay(expiry: ExpiryStatusFact): { display: string | null; origin: DateOrigin } {
  let origin: DateOrigin = 'UNKNOWN';
  
  // Determine origin
  if (expiry.isCalculated) {
    origin = 'CALCULATED';
  } else if (expiry.source === 'BARCODE_DATABASE') {
    origin = 'DATABASE';
  } else if (expiry.source === 'USER_CONFIRMED') {
    origin = 'USER_ENTERED';
  } else if (expiry.source?.startsWith('OCR')) {
    origin = 'PRINTED';
  }
  
  // Build display text
  let display: string | null = null;
  
  if (expiry.expiryDate) {
    const dateStr = expiry.expiryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    const originLabel = DATE_ORIGIN_LABELS[origin];
    
    if (expiry.status === 'EXPIRED') {
      display = `Expired: ${dateStr} (${originLabel})`;
    } else if (expiry.status === 'EXPIRING_SOON') {
      display = `Expires: ${dateStr} (${originLabel})`;
    } else {
      display = `Expires: ${dateStr} (${originLabel})`;
    }
  } else if (expiry.status === 'UNKNOWN') {
    display = 'Expiry date unknown';
  }
  
  return { display, origin };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export {
  determineVerdict,
  generateExplanations,
  generateBlockedSafeReasons,
  determineActions,
  getConfidenceLevel,
  buildExpiryDisplay,
};
