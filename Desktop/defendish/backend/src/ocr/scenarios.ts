// ============================================================================
// DEFENDISH OCR - TEST SCENARIOS
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Example scenarios demonstrating honest OCR behavior
// Focus: Poor image conditions, uncertainty handling, SAFE blocking
// ============================================================================

import { 
  OCRResult, 
  DetectedDate, 
  ImageQualityAssessment,
  OCRUXExplanation,
  createOCRFailure 
} from './types';
import { resolveExpiryWithOCR } from './expiryResolution.service';
import { ExpirySourceInput } from './types';

// ============================================================================
// SCENARIO 1: BLURRY IMAGE - HONEST FAILURE
// ============================================================================

/**
 * SCENARIO 1: User scans a product but camera is out of focus
 * 
 * CONDITION: Image sharpness = 0.2 (very blurry)
 * 
 * EXPECTED BEHAVIOR:
 * - OCR returns success=false
 * - failureReason is REQUIRED (not null)
 * - UX gets clear explanation
 * - SAFE is blocked
 * - User is prompted to rescan
 */
export const SCENARIO_1_BLURRY_IMAGE: OCRResult = {
  success: false,
  sessionId: 'ocr-session-001',
  timestamp: new Date('2026-01-06T10:00:00Z'),
  processingTimeMs: 1250,
  
  // Empty results due to failure
  detectedDates: [],
  fullTextDetected: '',
  authorityLevel: 'OCR_LOW_CONFIDENCE',
  overallConfidence: 0,
  
  // CRITICAL: Failure reason is NEVER null
  failureReason: 'IMAGE_TOO_BLURRY',
  failureExplanation: 'Image is too blurry to read text clearly',
  
  // Partial data if any text fragments were captured
  partialData: {
    rawTextFragments: ['...xp...', '...26'],
    possibleDateFragments: ['26'],
  },
  
  // Image quality assessment
  imageQuality: {
    overallScore: 0.2,
    metrics: {
      sharpness: 0.15,
      brightness: 0.7,
      contrast: 0.6,
      textClarity: 0.1,
    },
    issues: ['IMAGE_TOO_BLURRY'],
    isProcessable: false,
    improvementSuggestions: [
      'Hold the camera steady',
      'Tap to focus before capturing',
      'Try from a closer distance',
    ],
  },
  
  warnings: [],
  
  // UX explanation - always populated
  uxExplanation: {
    summary: 'Could not read the label - image is blurry',
    uncertaintyReasons: ['Image is too blurry to read text clearly'],
    dateOrigin: 'NOT_FOUND',
    blockedSafeReason: 'Cannot confirm safe: OCR failed (IMAGE_TOO_BLURRY)',
    confidenceExplanation: 'FAILED',
    requiredAction: 'RESCAN',
    userSuggestions: [
      'Hold the camera steady',
      'Tap to focus before capturing',
      'Try from a closer distance',
    ],
  },
};

/**
 * Expected resolution for Scenario 1
 */
export function testScenario1() {
  const existingSources: ExpirySourceInput[] = []; // No other sources
  const resolution = resolveExpiryWithOCR(existingSources, SCENARIO_1_BLURRY_IMAGE);
  
  // Assertions
  console.assert(resolution.status === 'UNKNOWN', 'Status should be UNKNOWN');
  console.assert(resolution.requiresManualReview === true, 'Should require manual review');
  console.assert(resolution.canContributeToSafe === false, 'Should NOT contribute to SAFE');
  console.assert(resolution.blockedSafeReason !== null, 'Should have blocked reason');
  
  console.log('Scenario 1 - Blurry Image:', {
    status: resolution.status,
    requiresManualReview: resolution.requiresManualReview,
    canContributeToSafe: resolution.canContributeToSafe,
    blockedSafeReason: resolution.blockedSafeReason,
    reviewReasons: resolution.reviewReasons,
  });
  
  return resolution;
}

// ============================================================================
// SCENARIO 2: AMBIGUOUS DATE FORMAT - HONEST UNCERTAINTY
// ============================================================================

/**
 * SCENARIO 2: OCR reads "01/02/26" but format is ambiguous
 * 
 * CONDITION: Date could be Jan 2 or Feb 1, 2026
 * 
 * EXPECTED BEHAVIOR:
 * - OCR returns success=true but LOW confidence
 * - Date is detected but type confidence is low
 * - UX explains WHY it's uncertain
 * - SAFE is blocked
 * - User is asked to verify manually
 */
export const SCENARIO_2_AMBIGUOUS_DATE: OCRResult = {
  success: true,
  sessionId: 'ocr-session-002',
  timestamp: new Date('2026-01-06T10:05:00Z'),
  processingTimeMs: 980,
  
  // Date detected but with low confidence
  detectedDates: [
    {
      value: new Date('2026-02-01'), // Assumed interpretation
      type: 'UNKNOWN', // Could not determine type
      valueConfidence: 0.45, // Low - ambiguous format
      typeConfidence: 0.30, // Very low - no type indicator
      overallConfidence: 0.38,
      rawText: '01/02/26',
      typeIndicator: null, // No "EXP:" or "MFG:" found
      boundingBox: { x: 120, y: 80, width: 60, height: 15 },
      source: 'PRINTED',
    },
  ],
  
  fullTextDetected: 'Product XYZ\n01/02/26\nNet Wt 500g',
  authorityLevel: 'OCR_LOW_CONFIDENCE',
  overallConfidence: 0.38,
  
  failureReason: null, // Not a failure, just uncertain
  failureExplanation: null,
  partialData: null,
  
  imageQuality: {
    overallScore: 0.75,
    metrics: {
      sharpness: 0.8,
      brightness: 0.7,
      contrast: 0.7,
      textClarity: 0.75,
    },
    issues: [],
    isProcessable: true,
    improvementSuggestions: [],
  },
  
  warnings: [
    'Date format is ambiguous (DD/MM/YY or MM/DD/YY)',
    'No date type indicator found (EXP, MFG, BB)',
  ],
  
  uxExplanation: {
    summary: 'Found a date but format is unclear',
    uncertaintyReasons: [
      'Date "01/02/26" could be January 2 or February 1',
      'Could not determine if this is expiry or manufacturing date',
    ],
    dateOrigin: 'PRINTED',
    blockedSafeReason: 'Cannot confirm safe: Date type unclear (could be manufacturing date)',
    confidenceExplanation: 'LOW',
    requiredAction: 'VERIFY_DATE',
    userSuggestions: [
      'Check the package for date format hints',
      'Look for "EXP" or "MFG" labels near the date',
      'Enter the date manually if you can read it',
    ],
  },
};

/**
 * Expected resolution for Scenario 2
 */
export function testScenario2() {
  const existingSources: ExpirySourceInput[] = [];
  const resolution = resolveExpiryWithOCR(existingSources, SCENARIO_2_AMBIGUOUS_DATE);
  
  // Assertions
  console.assert(resolution.requiresManualReview === true, 'Should require manual review');
  console.assert(resolution.canContributeToSafe === false, 'Should NOT contribute to SAFE');
  
  console.log('Scenario 2 - Ambiguous Date:', {
    status: resolution.status,
    resolvedExpiryDate: resolution.resolvedExpiryDate,
    primaryAuthority: resolution.primaryAuthority,
    requiresManualReview: resolution.requiresManualReview,
    canContributeToSafe: resolution.canContributeToSafe,
    blockedSafeReason: resolution.blockedSafeReason,
  });
  
  return resolution;
}

// ============================================================================
// SCENARIO 3: OCR CONFLICTS WITH BARCODE DATABASE
// ============================================================================

/**
 * SCENARIO 3: Barcode says 2026-03-15, OCR reads 2026-02-15
 * 
 * CONDITION: 28 days difference between sources
 * 
 * EXPECTED BEHAVIOR:
 * - OCR returns success=true with HIGH confidence
 * - Barcode database has HIGHER authority (100 vs 60)
 * - Conflict is detected and logged
 * - Barcode date is used (higher authority)
 * - Conflict is surfaced for potential investigation
 * - SAFE is allowed (higher authority source is trusted)
 */
export const SCENARIO_3_OCR_HIGH_CONFIDENCE: OCRResult = {
  success: true,
  sessionId: 'ocr-session-003',
  timestamp: new Date('2026-01-06T10:10:00Z'),
  processingTimeMs: 850,
  
  detectedDates: [
    {
      value: new Date('2026-02-15'),
      type: 'EXP',
      valueConfidence: 0.92,
      typeConfidence: 0.95,
      overallConfidence: 0.93,
      rawText: 'EXP: 15/02/2026',
      typeIndicator: 'EXP:',
      boundingBox: { x: 100, y: 150, width: 100, height: 20 },
      source: 'PRINTED',
    },
  ],
  
  fullTextDetected: 'Best Quality Product\nIngredients: ...\nEXP: 15/02/2026\nBatch: XY123',
  authorityLevel: 'OCR_HIGH_CONFIDENCE',
  overallConfidence: 0.93,
  
  failureReason: null,
  failureExplanation: null,
  partialData: null,
  
  imageQuality: {
    overallScore: 0.92,
    metrics: {
      sharpness: 0.95,
      brightness: 0.88,
      contrast: 0.90,
      textClarity: 0.93,
    },
    issues: [],
    isProcessable: true,
    improvementSuggestions: [],
  },
  
  warnings: [],
  
  uxExplanation: {
    summary: 'Expiry date detected: February 15, 2026',
    uncertaintyReasons: [],
    dateOrigin: 'PRINTED',
    blockedSafeReason: null, // OCR alone would allow SAFE
    confidenceExplanation: 'HIGH',
    requiredAction: 'NONE',
    userSuggestions: [],
  },
};

/**
 * Barcode database source (higher authority)
 */
export const SCENARIO_3_BARCODE_SOURCE: ExpirySourceInput = {
  source: 'BARCODE_DATABASE',
  authority: 100,
  expiryDate: new Date('2026-03-15'), // Different from OCR!
  manufacturingDate: new Date('2025-09-15'),
  bestBeforeDate: null,
  confidence: 1.0,
  timestamp: new Date('2026-01-06T10:10:00Z'),
  isCalculated: false,
  metadata: {
    barcodeNumber: '5901234123457',
  },
};

/**
 * Expected resolution for Scenario 3
 */
export function testScenario3() {
  const existingSources: ExpirySourceInput[] = [SCENARIO_3_BARCODE_SOURCE];
  const resolution = resolveExpiryWithOCR(existingSources, SCENARIO_3_OCR_HIGH_CONFIDENCE);
  
  // Assertions
  console.assert(
    resolution.resolvedExpiryDate?.getTime() === SCENARIO_3_BARCODE_SOURCE.expiryDate?.getTime(),
    'Should use BARCODE date (higher authority)'
  );
  console.assert(resolution.hadConflict === true, 'Should detect conflict');
  console.assert(resolution.primarySource === 'BARCODE_DATABASE', 'Primary source should be barcode');
  
  console.log('Scenario 3 - OCR vs Barcode Conflict:', {
    resolvedExpiryDate: resolution.resolvedExpiryDate,
    primarySource: resolution.primarySource,
    primaryAuthority: resolution.primaryAuthority,
    hadConflict: resolution.hadConflict,
    conflicts: resolution.conflicts.map(c => ({
      sourceA: `${c.sourceA.source} (${c.sourceA.authority})`,
      sourceB: `${c.sourceB.source} (${c.sourceB.authority})`,
      daysDifference: c.daysDifference,
      resolution: c.resolution,
    })),
    canContributeToSafe: resolution.canContributeToSafe,
  });
  
  return resolution;
}

// ============================================================================
// RUN ALL SCENARIOS
// ============================================================================

export function runAllScenarios() {
  console.log('\n========================================');
  console.log('DEFENDISH OCR SCENARIOS');
  console.log('========================================\n');
  
  console.log('--- SCENARIO 1: Blurry Image ---');
  testScenario1();
  
  console.log('\n--- SCENARIO 2: Ambiguous Date Format ---');
  testScenario2();
  
  console.log('\n--- SCENARIO 3: OCR Conflicts with Barcode ---');
  testScenario3();
  
  console.log('\n========================================');
  console.log('ALL SCENARIOS COMPLETE');
  console.log('========================================\n');
}

// ============================================================================
// SCENARIO SUMMARY TABLE
// ============================================================================

/**
 * SCENARIO SUMMARY
 * 
 * | # | Condition              | OCR Success | Confidence | SAFE Blocked? | Why                                    |
 * |---|------------------------|-------------|------------|---------------|----------------------------------------|
 * | 1 | Blurry image           | FALSE       | 0%         | YES           | OCR failed (IMAGE_TOO_BLURRY)          |
 * | 2 | Ambiguous date format  | TRUE        | 38%        | YES           | Date type unclear, low confidence       |
 * | 3 | Conflicts with barcode | TRUE        | 93%        | NO            | Higher authority source used (barcode)  |
 * 
 * KEY PRINCIPLES DEMONSTRATED:
 * 
 * 1. NEVER SILENT FAILURE
 *    - Scenario 1: failureReason is REQUIRED, not null
 *    - Every failure has explanation + user suggestions
 * 
 * 2. NEVER OVERSTATE CERTAINTY
 *    - Scenario 2: Date found but confidence reflects ambiguity
 *    - OCR reports WHAT it sees AND WHY it's uncertain
 * 
 * 3. AUTHORITY HIERARCHY RESPECTED
 *    - Scenario 3: OCR cannot override higher authority sources
 *    - Conflicts are logged but higher authority wins
 * 
 * 4. SAFE VERDICT PROTECTION
 *    - Scenarios 1 & 2: SAFE blocked due to uncertainty
 *    - Scenario 3: SAFE allowed because barcode (authority 100) is trusted
 * 
 * 5. UX TRANSPARENCY
 *    - All scenarios include uxExplanation with:
 *      - summary (what happened)
 *      - uncertaintyReasons (why uncertain)
 *      - blockedSafeReason (why SAFE not allowed)
 *      - requiredAction (what user should do)
 *      - userSuggestions (how to fix)
 */
