// ============================================================================
// DEFENDISH OCR - AUTHORITY INTEGRATION RULES
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Rules for integrating OCR with authority-based decision engine
// Core Rule: OCR can CONFIRM but never OVERRIDE higher authority sources
// ============================================================================

import { DataSourceType, AUTHORITY_RANKING, MINIMUM_AUTHORITY_THRESHOLDS } from '../decision-engine/types';
import { OCRResult, OCR_CONFIDENCE_THRESHOLDS, ExpirySourceInput } from './types';

// ============================================================================
// AUTHORITY MAPPING
// ============================================================================

/**
 * Map OCR confidence to decision engine authority level
 */
export function mapConfidenceToAuthority(confidence: number): DataSourceType {
  if (confidence >= OCR_CONFIDENCE_THRESHOLDS.HIGH) {
    return 'OCR_HIGH_CONFIDENCE';
  } else if (confidence >= OCR_CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'OCR_MEDIUM_CONFIDENCE';
  } else {
    return 'OCR_LOW_CONFIDENCE';
  }
}

/**
 * Get numeric authority score from OCR confidence
 */
export function getAuthorityScore(confidence: number): number {
  const authorityLevel = mapConfidenceToAuthority(confidence);
  return AUTHORITY_RANKING[authorityLevel];
}

// ============================================================================
// AUTHORITY INTEGRATION RULES
// ============================================================================

/**
 * Authority Integration Rules
 * 
 * These rules govern how OCR data interacts with other data sources
 * in the decision engine.
 */
export const AUTHORITY_RULES = {
  
  // ===========================================================================
  // RULE 1: OCR Cannot Override Higher Authority Sources
  // ===========================================================================
  
  /**
   * BARCODE_DATABASE (100) and MANUFACTURER_QR (95) ALWAYS win over OCR
   * 
   * Even if OCR is HIGH confidence (60), it cannot change:
   * - Barcode database expiry date
   * - Manufacturer QR code data
   * 
   * WHY: Database/QR sources are verified; OCR is inherently error-prone
   */
  ocrCannotOverride: ['BARCODE_DATABASE', 'MANUFACTURER_QR'] as DataSourceType[],
  
  // ===========================================================================
  // RULE 2: OCR Cannot Override User-Confirmed Data
  // ===========================================================================
  
  /**
   * USER_CONFIRMED (80) takes precedence over all OCR levels
   * 
   * OCR_HIGH_CONFIDENCE = 60
   * OCR_MEDIUM_CONFIDENCE = 40
   * OCR_LOW_CONFIDENCE = 20
   * 
   * User has physically looked at the product and confirmed
   * OCR should not second-guess human verification
   */
  userOverridesOCR: true,
  userAuthorityThreshold: AUTHORITY_RANKING['USER_CONFIRMED'], // 80
  
  // ===========================================================================
  // RULE 3: Low Confidence OCR Triggers Manual Review
  // ===========================================================================
  
  /**
   * OCR below MEDIUM confidence (0.5) MUST trigger requiresManualReview
   * 
   * This ensures:
   * - User is notified of uncertainty
   * - SAFE verdict is blocked until verification
   * - No silent failures
   */
  lowConfidenceThreshold: OCR_CONFIDENCE_THRESHOLDS.MEDIUM, // 0.5
  
  // ===========================================================================
  // RULE 4: OCR Can CONFIRM (Not Override) Higher Authority
  // ===========================================================================
  
  /**
   * If OCR agrees with higher authority source:
   * - Increases confidence in the data
   * - Can be noted in audit log
   * - Does NOT change the authority ranking
   * 
   * If OCR disagrees with higher authority source:
   * - Flags a DATA_CONFLICT
   * - Higher authority value is used
   * - Conflict is surfaced for potential review
   */
  ocrCanConfirmHigherAuthority: true,
  
  // ===========================================================================
  // RULE 5: OCR Can Fill Missing Data
  // ===========================================================================
  
  /**
   * If higher authority source has NO expiry date:
   * - OCR can provide the expiry date
   * - Authority level is based on OCR confidence
   * - requiresManualReview if confidence < 0.8
   */
  ocrCanFillMissing: true,
  fillConfidenceThreshold: OCR_CONFIDENCE_THRESHOLDS.HIGH, // 0.8
  
  // ===========================================================================
  // RULE 6: Multiple OCR Scans Aggregation
  // ===========================================================================
  
  /**
   * Multiple OCR scans of same product:
   * - Use highest confidence reading
   * - Flag if readings disagree by > 1 day
   * - Never average dates (pick one)
   */
  multiScanStrategy: 'HIGHEST_CONFIDENCE' as const,
  multiScanConflictDays: 1,
};

// ============================================================================
// AUTHORITY CHECK FUNCTIONS
// ============================================================================

/**
 * Check if OCR can contribute to decision
 * Returns whether OCR data should be used and why
 */
export interface AuthorityCheckResult {
  canContribute: boolean;
  reason: string;
  adjustedAuthority: number;
  requiresManualReview: boolean;
  reviewReason?: string;
}

/**
 * Check if OCR result can contribute to expiry decision
 */
export function checkOCRAuthorityForExpiry(
  ocrResult: OCRResult,
  existingSources: ExpirySourceInput[]
): AuthorityCheckResult {
  
  // Failed OCR cannot contribute
  if (!ocrResult.success) {
    return {
      canContribute: false,
      reason: `OCR failed: ${ocrResult.failureReason}`,
      adjustedAuthority: 0,
      requiresManualReview: true,
      reviewReason: ocrResult.failureExplanation || 'OCR processing failed',
    };
  }
  
  // No dates detected
  if (ocrResult.detectedDates.length === 0) {
    return {
      canContribute: false,
      reason: 'No dates detected by OCR',
      adjustedAuthority: 0,
      requiresManualReview: true,
      reviewReason: 'OCR could not find any dates on the product',
    };
  }
  
  const ocrAuthority = getAuthorityScore(ocrResult.overallConfidence);
  
  // Check for higher authority sources
  const higherAuthoritySources = existingSources.filter(
    source => source.authority > ocrAuthority
  );
  
  // Higher authority exists with expiry date
  const higherWithExpiry = higherAuthoritySources.find(s => s.expiryDate !== null);
  
  if (higherWithExpiry) {
    // OCR cannot override, but can confirm
    return {
      canContribute: true, // Can still be recorded
      reason: `Higher authority source (${higherWithExpiry.source}) takes precedence. OCR recorded for audit.`,
      adjustedAuthority: Math.min(ocrAuthority, higherWithExpiry.authority - 10), // Lower than existing
      requiresManualReview: false,
      reviewReason: undefined,
    };
  }
  
  // Check if confidence is too low
  if (ocrResult.overallConfidence < AUTHORITY_RULES.lowConfidenceThreshold) {
    return {
      canContribute: true, // Can contribute but needs review
      reason: 'Low confidence OCR - requires manual verification',
      adjustedAuthority: ocrAuthority,
      requiresManualReview: true,
      reviewReason: `OCR confidence (${(ocrResult.overallConfidence * 100).toFixed(0)}%) is below threshold`,
    };
  }
  
  // OCR can fill missing data
  if (!existingSources.some(s => s.expiryDate !== null)) {
    const needsReview = ocrResult.overallConfidence < AUTHORITY_RULES.fillConfidenceThreshold;
    return {
      canContribute: true,
      reason: 'OCR providing expiry date (no higher authority source available)',
      adjustedAuthority: ocrAuthority,
      requiresManualReview: needsReview,
      reviewReason: needsReview 
        ? `OCR confidence (${(ocrResult.overallConfidence * 100).toFixed(0)}%) requires verification`
        : undefined,
    };
  }
  
  // Default: can contribute at its authority level
  return {
    canContribute: true,
    reason: 'OCR accepted at confidence-based authority level',
    adjustedAuthority: ocrAuthority,
    requiresManualReview: ocrResult.overallConfidence < OCR_CONFIDENCE_THRESHOLDS.HIGH,
    reviewReason: ocrResult.overallConfidence < OCR_CONFIDENCE_THRESHOLDS.HIGH
      ? 'OCR below high confidence threshold'
      : undefined,
  };
}

/**
 * Check if OCR conflicts with existing source
 */
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType: 'NONE' | 'DATE_MISMATCH' | 'TYPE_MISMATCH';
  daysDifference: number | null;
  resolution: 'USE_HIGHER_AUTHORITY' | 'USE_OCR' | 'MANUAL_REQUIRED';
  resolutionReason: string;
}

export function checkForConflict(
  ocrDate: Date,
  existingDate: Date,
  ocrAuthority: number,
  existingAuthority: number
): ConflictCheckResult {
  
  const daysDiff = Math.abs(
    Math.floor((ocrDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  // No conflict if dates are within 1 day
  if (daysDiff <= AUTHORITY_RULES.multiScanConflictDays) {
    return {
      hasConflict: false,
      conflictType: 'NONE',
      daysDifference: daysDiff,
      resolution: 'USE_HIGHER_AUTHORITY',
      resolutionReason: 'Dates are consistent (within 1 day)',
    };
  }
  
  // Conflict exists
  const authorityDiff = existingAuthority - ocrAuthority;
  
  if (authorityDiff >= MINIMUM_AUTHORITY_THRESHOLDS.AUTO_RESOLVE_CONFLICT) {
    // Clear winner
    return {
      hasConflict: true,
      conflictType: 'DATE_MISMATCH',
      daysDifference: daysDiff,
      resolution: 'USE_HIGHER_AUTHORITY',
      resolutionReason: `Higher authority source (${existingAuthority}) overrides OCR (${ocrAuthority})`,
    };
  }
  
  if (authorityDiff > 0) {
    // Higher authority wins but difference is small
    return {
      hasConflict: true,
      conflictType: 'DATE_MISMATCH',
      daysDifference: daysDiff,
      resolution: 'USE_HIGHER_AUTHORITY',
      resolutionReason: `Higher authority wins, but conflict flagged for review (${daysDiff} days difference)`,
    };
  }
  
  if (authorityDiff < 0) {
    // OCR has higher authority (shouldn't happen with proper sources)
    return {
      hasConflict: true,
      conflictType: 'DATE_MISMATCH',
      daysDifference: daysDiff,
      resolution: 'USE_OCR',
      resolutionReason: `OCR has higher authority - unusual, flagging for review`,
    };
  }
  
  // Equal authority - manual review needed
  return {
    hasConflict: true,
    conflictType: 'DATE_MISMATCH',
    daysDifference: daysDiff,
    resolution: 'MANUAL_REQUIRED',
    resolutionReason: `Equal authority sources disagree by ${daysDiff} days - user must decide`,
  };
}

// ============================================================================
// SAFE VERDICT BLOCKING RULES
// ============================================================================

/**
 * Determine if OCR result blocks SAFE verdict
 * Returns the reason if blocked, null if not blocked
 */
export function getBlockedSafeReason(ocrResult: OCRResult): string | null {
  
  // Failed OCR blocks SAFE
  if (!ocrResult.success) {
    return `Cannot confirm safe: OCR failed (${ocrResult.failureReason})`;
  }
  
  // No dates found blocks SAFE (can't verify expiry)
  if (ocrResult.detectedDates.length === 0) {
    return 'Cannot confirm safe: No expiry date detected';
  }
  
  // Low confidence blocks SAFE
  if (ocrResult.overallConfidence < OCR_CONFIDENCE_THRESHOLDS.MEDIUM) {
    return `Cannot confirm safe: OCR confidence too low (${(ocrResult.overallConfidence * 100).toFixed(0)}%)`;
  }
  
  // Date type unknown blocks SAFE
  const expiryDate = ocrResult.detectedDates.find(d => d.type === 'EXP');
  if (!expiryDate) {
    const hasUnknownType = ocrResult.detectedDates.some(d => d.type === 'UNKNOWN');
    if (hasUnknownType) {
      return 'Cannot confirm safe: Date type unclear (could be manufacturing date)';
    }
    return 'Cannot confirm safe: No expiry date found (only manufacturing/best-before dates)';
  }
  
  // Expiry date type has low confidence
  if (expiryDate.typeConfidence < OCR_CONFIDENCE_THRESHOLDS.MEDIUM) {
    return `Cannot confirm safe: Uncertain if date is expiry or manufacturing (${(expiryDate.typeConfidence * 100).toFixed(0)}% confidence)`;
  }
  
  // Warnings present reduce confidence
  if (ocrResult.warnings.length > 2) {
    return `Cannot confirm safe: Multiple warnings detected during OCR`;
  }
  
  // Image quality issues
  if (ocrResult.imageQuality.overallScore < 0.5) {
    return `Cannot confirm safe: Poor image quality (${(ocrResult.imageQuality.overallScore * 100).toFixed(0)}% quality score)`;
  }
  
  return null; // Not blocked
}

// ============================================================================
// CONVERSION TO DECISION ENGINE INPUT
// ============================================================================

/**
 * Convert OCR result to decision engine ExpiryInput format
 */
export function convertOCRToExpiryInput(ocrResult: OCRResult): ExpirySourceInput | null {
  if (!ocrResult.success || ocrResult.detectedDates.length === 0) {
    return null;
  }
  
  // Find dates by type
  const expiryDate = ocrResult.detectedDates.find(d => d.type === 'EXP');
  const mfgDate = ocrResult.detectedDates.find(d => d.type === 'MFG');
  const bbDate = ocrResult.detectedDates.find(d => d.type === 'BB');
  
  // Use best before as expiry if no explicit expiry
  const effectiveExpiry = expiryDate?.value || bbDate?.value || null;
  
  // Determine if date was calculated
  const isCalculated = ocrResult.detectedDates.some(d => d.source === 'CALCULATED');
  
  return {
    source: 'OCR',
    authority: getAuthorityScore(ocrResult.overallConfidence),
    expiryDate: effectiveExpiry,
    manufacturingDate: mfgDate?.value || null,
    bestBeforeDate: bbDate?.value || null,
    confidence: ocrResult.overallConfidence,
    timestamp: ocrResult.timestamp,
    isCalculated,
    metadata: {
      ocrSessionId: ocrResult.sessionId,
    },
  };
}
