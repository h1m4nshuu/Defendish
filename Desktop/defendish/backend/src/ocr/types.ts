// ============================================================================
// DEFENDISH OCR SYSTEM - TYPE DEFINITIONS
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Honest, safety-critical OCR output contract
// Guiding Principle: Never silently fail, never overstate certainty
// ============================================================================

// ============================================================================
// DATE TYPE CLASSIFICATIONS
// ============================================================================

/**
 * Type of date detected on product packaging
 * Critical for expiry determination logic
 */
export type DateType =
  | 'EXP'   // Expiry date / Use by date
  | 'MFG'   // Manufacturing date
  | 'BB'    // Best before date
  | 'PKD'   // Packed date
  | 'UNKNOWN'; // Date found but type undetermined

/**
 * Keywords that indicate date type on packaging
 */
export const DATE_TYPE_KEYWORDS: Record<DateType, string[]> = {
  'EXP': [
    'exp', 'expiry', 'expires', 'use by', 'use-by', 'useby',
    'exp date', 'expiration', 'consume by', 'do not use after'
  ],
  'MFG': [
    'mfg', 'mfd', 'manufactured', 'mfr', 'production date',
    'date of manufacture', 'dom'
  ],
  'BB': [
    'bb', 'best before', 'best by', 'best-before', 'best if used by',
    'best when used by', 'sell by'
  ],
  'PKD': [
    'pkd', 'packed', 'packed on', 'pack date', 'packing date'
  ],
  'UNKNOWN': []
};

// ============================================================================
// OCR CONFIDENCE LEVELS
// ============================================================================

/**
 * OCR confidence thresholds
 * Maps to decision engine authority levels
 */
export const OCR_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,      // Maps to OCR_HIGH_CONFIDENCE (authority: 60)
  MEDIUM: 0.5,    // Maps to OCR_MEDIUM_CONFIDENCE (authority: 40)
  LOW: 0.0,       // Maps to OCR_LOW_CONFIDENCE (authority: 20)
};

/**
 * Minimum confidence required for different actions
 */
export const OCR_MINIMUM_CONFIDENCE = {
  AUTO_ACCEPT_DATE: 0.8,         // Below this, date needs verification
  SHOW_DATE_SUGGESTION: 0.4,     // Below this, date not shown at all
  TRIGGER_RESCAN: 0.3,           // Below this, prompt user to rescan
};

// ============================================================================
// FAILURE REASON TYPES
// ============================================================================

/**
 * Enumerated failure reasons - null is FORBIDDEN
 * Every OCR call must return either success or a specific failure
 */
export type OCRFailureReason =
  // Image quality issues
  | 'IMAGE_TOO_BLURRY'
  | 'IMAGE_TOO_DARK'
  | 'IMAGE_TOO_BRIGHT'
  | 'IMAGE_RESOLUTION_TOO_LOW'
  | 'NO_TEXT_DETECTED'
  | 'TEXT_PARTIALLY_VISIBLE'
  | 'TEXT_OBSCURED'
  | 'GLARE_DETECTED'
  | 'MOTION_BLUR'
  
  // Date parsing issues
  | 'NO_DATE_PATTERN_FOUND'
  | 'AMBIGUOUS_DATE_FORMAT'
  | 'INVALID_DATE_VALUE'
  | 'MULTIPLE_CONFLICTING_DATES'
  | 'DATE_TYPE_UNDETERMINED'
  | 'PARTIAL_DATE_DETECTED'
  
  // System issues
  | 'OCR_ENGINE_ERROR'
  | 'TIMEOUT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'UNSUPPORTED_IMAGE_FORMAT'
  
  // Validation issues
  | 'DATE_IN_PAST_BY_YEARS'
  | 'DATE_TOO_FAR_IN_FUTURE'
  | 'IMPLAUSIBLE_SHELF_LIFE';

/**
 * Human-readable explanations for failure reasons
 */
export const FAILURE_EXPLANATIONS: Record<OCRFailureReason, string> = {
  'IMAGE_TOO_BLURRY': 'Image is too blurry to read text clearly',
  'IMAGE_TOO_DARK': 'Image is too dark - try adding more light',
  'IMAGE_TOO_BRIGHT': 'Image is overexposed - reduce lighting or glare',
  'IMAGE_RESOLUTION_TOO_LOW': 'Image resolution is too low for reliable reading',
  'NO_TEXT_DETECTED': 'No text was detected in the image',
  'TEXT_PARTIALLY_VISIBLE': 'Some text is cut off or not fully visible',
  'TEXT_OBSCURED': 'Text is covered or obscured by another object',
  'GLARE_DETECTED': 'Reflective glare is blocking text',
  'MOTION_BLUR': 'Camera shake caused motion blur',
  
  'NO_DATE_PATTERN_FOUND': 'No date pattern was found in the text',
  'AMBIGUOUS_DATE_FORMAT': 'Date format is unclear (e.g., 01/02/26 could be Jan 2 or Feb 1)',
  'INVALID_DATE_VALUE': 'Date values are invalid (e.g., month 13)',
  'MULTIPLE_CONFLICTING_DATES': 'Multiple dates found that conflict with each other',
  'DATE_TYPE_UNDETERMINED': 'Could not determine if date is expiry, manufacturing, or best-before',
  'PARTIAL_DATE_DETECTED': 'Only part of the date was readable',
  
  'OCR_ENGINE_ERROR': 'OCR processing encountered an error',
  'TIMEOUT_EXCEEDED': 'Processing took too long and was stopped',
  'MEMORY_LIMIT_EXCEEDED': 'Image too large to process',
  'UNSUPPORTED_IMAGE_FORMAT': 'Image format is not supported',
  
  'DATE_IN_PAST_BY_YEARS': 'Detected date is years in the past (likely misread)',
  'DATE_TOO_FAR_IN_FUTURE': 'Detected date is unreasonably far in the future',
  'IMPLAUSIBLE_SHELF_LIFE': 'Calculated shelf life seems implausible for this product type',
};

// ============================================================================
// DETECTED DATE TYPES
// ============================================================================

/**
 * A single detected date from OCR
 */
export interface DetectedDate {
  /** The parsed date value */
  value: Date;
  
  /** Type of date (EXP/MFG/BB/PKD/UNKNOWN) */
  type: DateType;
  
  /** Confidence in date value accuracy (0.0 - 1.0) */
  valueConfidence: number;
  
  /** Confidence in date type classification (0.0 - 1.0) */
  typeConfidence: number;
  
  /** Combined confidence score */
  overallConfidence: number;
  
  /** Original text that was parsed */
  rawText: string;
  
  /** Text that indicated the date type (e.g., "EXP:", "Best Before") */
  typeIndicator: string | null;
  
  /** Bounding box coordinates in original image */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  
  /** Source of this date */
  source: 'PRINTED' | 'CALCULATED';
  
  /** If calculated, explain how */
  calculationMethod?: string;
}

/**
 * Image quality assessment
 */
export interface ImageQualityAssessment {
  /** Overall quality score (0.0 - 1.0) */
  overallScore: number;
  
  /** Individual quality metrics */
  metrics: {
    sharpness: number;
    brightness: number;
    contrast: number;
    textClarity: number;
  };
  
  /** Issues detected */
  issues: OCRFailureReason[];
  
  /** Is image good enough to proceed? */
  isProcessable: boolean;
  
  /** Suggestions for improvement */
  improvementSuggestions: string[];
}

// ============================================================================
// OCR RESULT CONTRACT
// ============================================================================

/**
 * OCR Result Contract
 * 
 * CRITICAL: This interface enforces honest output
 * - success=true requires detectedDates
 * - success=false requires failureReason (NEVER null)
 * - confidence is ALWAYS required
 */
export interface OCRResult {
  /** Whether OCR completed successfully */
  success: boolean;
  
  /** Unique ID for this OCR session (for audit) */
  sessionId: string;
  
  /** Timestamp of processing */
  timestamp: Date;
  
  /** Processing time in milliseconds */
  processingTimeMs: number;
  
  // =========== SUCCESS FIELDS ===========
  
  /** Detected dates (empty array if none found, not null) */
  detectedDates: DetectedDate[];
  
  /** Full text detected (for debugging/audit) */
  fullTextDetected: string;
  
  /** Authority level based on confidence */
  authorityLevel: 'OCR_HIGH_CONFIDENCE' | 'OCR_MEDIUM_CONFIDENCE' | 'OCR_LOW_CONFIDENCE';
  
  /** Overall confidence score (0.0 - 1.0) */
  overallConfidence: number;
  
  // =========== FAILURE FIELDS ===========
  
  /** 
   * Failure reason - REQUIRED if success=false
   * MUST be one of the enumerated reasons, NEVER null or undefined
   */
  failureReason: OCRFailureReason | null;
  
  /** Human-readable failure explanation */
  failureExplanation: string | null;
  
  /** Partial data recovered despite failure */
  partialData: {
    rawTextFragments: string[];
    possibleDateFragments: string[];
  } | null;
  
  // =========== QUALITY & AUDIT ===========
  
  /** Image quality assessment */
  imageQuality: ImageQualityAssessment;
  
  /** Warnings (issues that didn't cause failure but reduce confidence) */
  warnings: string[];
  
  /** 
   * UX explanation data
   * Always populated to explain the result to users
   */
  uxExplanation: OCRUXExplanation;
}

/**
 * UX Explanation for OCR result
 * Provides all data needed for transparent user communication
 */
export interface OCRUXExplanation {
  /** Short summary for display */
  summary: string;
  
  /** Why the date is uncertain (if applicable) */
  uncertaintyReasons: string[];
  
  /** Whether date was printed or calculated */
  dateOrigin: 'PRINTED' | 'CALCULATED' | 'UNKNOWN' | 'NOT_FOUND';
  
  /** If SAFE was blocked, why */
  blockedSafeReason: string | null;
  
  /** Confidence level in plain language */
  confidenceExplanation: 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';
  
  /** Action required from user */
  requiredAction: 'NONE' | 'VERIFY_DATE' | 'RESCAN' | 'MANUAL_ENTRY';
  
  /** Suggestions for user */
  userSuggestions: string[];
}

// ============================================================================
// EXPIRY RESOLUTION TYPES
// ============================================================================

/**
 * Input to expiry resolution from multiple sources
 */
export interface ExpirySourceInput {
  source: 'BARCODE_DATABASE' | 'MANUFACTURER_QR' | 'USER_CONFIRMED' | 'OCR';
  
  /** Authority score (from AUTHORITY_RANKING) */
  authority: number;
  
  /** The dates from this source */
  expiryDate: Date | null;
  manufacturingDate: Date | null;
  bestBeforeDate: Date | null;
  
  /** Confidence for this source */
  confidence: number;
  
  /** When this data was obtained */
  timestamp: Date;
  
  /** Whether the date was calculated */
  isCalculated: boolean;
  
  /** Additional metadata */
  metadata?: {
    ocrSessionId?: string;
    barcodeNumber?: string;
    userConfirmedAt?: Date;
  };
}

/**
 * Resolved expiry decision
 */
export interface ExpiryResolution {
  /** The resolved expiry date (null if couldn't determine) */
  resolvedExpiryDate: Date | null;
  
  /** Source used for resolution */
  primarySource: string;
  primaryAuthority: number;
  
  /** Status determination */
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
  daysUntilExpiry: number | null;
  
  /** Was there conflict between sources? */
  hadConflict: boolean;
  conflicts: ExpiryConflict[];
  
  /** Does this need user verification? */
  requiresManualReview: boolean;
  reviewReasons: string[];
  
  /** Can this contribute to a SAFE verdict? */
  canContributeToSafe: boolean;
  blockedSafeReason: string | null;
  
  /** Audit trail */
  allSourcesConsidered: ExpirySourceInput[];
  resolutionTimestamp: Date;
}

/**
 * Expiry conflict between sources
 */
export interface ExpiryConflict {
  field: 'expiryDate' | 'manufacturingDate' | 'bestBeforeDate';
  
  sourceA: {
    source: string;
    authority: number;
    value: Date;
  };
  
  sourceB: {
    source: string;
    authority: number;
    value: Date;
  };
  
  /** Days difference between the two dates */
  daysDifference: number;
  
  /** How was it resolved? */
  resolution: 'HIGHER_AUTHORITY' | 'MORE_RECENT' | 'MANUAL_REQUIRED';
  
  /** Which value was chosen */
  resolvedTo: Date | null;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard: Validates that OCRResult is properly formed
 */
export function isValidOCRResult(result: any): result is OCRResult {
  if (!result || typeof result !== 'object') return false;
  if (typeof result.success !== 'boolean') return false;
  if (!result.sessionId) return false;
  if (!result.timestamp) return false;
  
  // If failed, must have failure reason
  if (!result.success && !result.failureReason) {
    console.error('INVALID OCR RESULT: Failed without failureReason');
    return false;
  }
  
  // detectedDates must be array (not null)
  if (!Array.isArray(result.detectedDates)) {
    console.error('INVALID OCR RESULT: detectedDates must be array');
    return false;
  }
  
  // Must have UX explanation
  if (!result.uxExplanation) {
    console.error('INVALID OCR RESULT: Missing uxExplanation');
    return false;
  }
  
  return true;
}

/**
 * Creates a failure OCRResult with proper typing
 */
export function createOCRFailure(
  sessionId: string,
  reason: OCRFailureReason,
  imageQuality: ImageQualityAssessment,
  partialData?: { rawTextFragments: string[]; possibleDateFragments: string[] }
): OCRResult {
  return {
    success: false,
    sessionId,
    timestamp: new Date(),
    processingTimeMs: 0,
    
    detectedDates: [],
    fullTextDetected: '',
    authorityLevel: 'OCR_LOW_CONFIDENCE',
    overallConfidence: 0,
    
    failureReason: reason,
    failureExplanation: FAILURE_EXPLANATIONS[reason],
    partialData: partialData || null,
    
    imageQuality,
    warnings: [],
    
    uxExplanation: {
      summary: FAILURE_EXPLANATIONS[reason],
      uncertaintyReasons: [FAILURE_EXPLANATIONS[reason]],
      dateOrigin: 'NOT_FOUND',
      blockedSafeReason: `OCR failed: ${FAILURE_EXPLANATIONS[reason]}`,
      confidenceExplanation: 'FAILED',
      requiredAction: reason.startsWith('IMAGE_') ? 'RESCAN' : 'MANUAL_ENTRY',
      userSuggestions: getFailureSuggestions(reason),
    },
  };
}

/**
 * Get user suggestions based on failure reason
 */
function getFailureSuggestions(reason: OCRFailureReason): string[] {
  const suggestions: Record<string, string[]> = {
    'IMAGE_TOO_BLURRY': ['Hold the camera steady', 'Tap to focus before capturing', 'Try from a closer distance'],
    'IMAGE_TOO_DARK': ['Move to a well-lit area', 'Turn on the flash', 'Face a light source'],
    'IMAGE_TOO_BRIGHT': ['Reduce lighting', 'Avoid direct sunlight', 'Angle to avoid glare'],
    'GLARE_DETECTED': ['Angle the product slightly', 'Move away from direct light', 'Try matte lighting'],
    'NO_DATE_PATTERN_FOUND': ['Make sure the date is in frame', 'Check for printed dates on the package', 'Try scanning a different label area'],
    'AMBIGUOUS_DATE_FORMAT': ['Enter the date manually', 'Check the package for date format hints'],
  };
  
  return suggestions[reason] || ['Try scanning again', 'Enter the date manually if visible'];
}
