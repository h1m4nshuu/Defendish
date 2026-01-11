// ============================================================================
// DEFENDISH OCR - EXPIRY RESOLUTION SERVICE
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Resolve expiry date from multiple sources with authority ranking
// Guiding Principle: Higher authority wins, but never hide conflicts
// ============================================================================

import { 
  ExpirySourceInput, 
  ExpiryResolution, 
  ExpiryConflict,
  OCRResult 
} from './types';
import { 
  AUTHORITY_RULES, 
  checkOCRAuthorityForExpiry,
  checkForConflict,
  convertOCRToExpiryInput 
} from './authorityRules';

// ============================================================================
// EXPIRY RESOLUTION PSEUDOCODE
// ============================================================================

/**
 * EXPIRY RESOLUTION ALGORITHM
 * 
 * STEP 1: Collect all sources
 *   - Barcode database
 *   - Manufacturer QR
 *   - User confirmed
 *   - OCR results
 * 
 * STEP 2: Sort by authority (descending)
 *   - BARCODE_DATABASE: 100
 *   - MANUFACTURER_QR: 95
 *   - USER_CONFIRMED: 80
 *   - OCR_HIGH: 60
 *   - OCR_MEDIUM: 40
 *   - OCR_LOW: 20
 * 
 * STEP 3: Check for conflicts
 *   FOR each pair of sources with expiry dates:
 *     IF dates differ by > 1 day:
 *       Record conflict
 *       IF authority difference >= 80: AUTO_RESOLVED (higher wins)
 *       ELSE: MANUAL_REQUIRED
 * 
 * STEP 4: Select primary source
 *   - Use highest authority source with expiry date
 *   - If highest has no expiry, fall through to next
 * 
 * STEP 5: Determine status
 *   - Calculate days until expiry
 *   - Classify as VALID/EXPIRING_SOON/EXPIRED/UNKNOWN
 * 
 * STEP 6: Determine if SAFE is blocked
 *   - Any unresolved conflicts → blocked
 *   - Authority < 60 → blocked
 *   - No expiry date → blocked
 *   - EXPIRED → blocked (but not for SAFE, for AVOID)
 * 
 * STEP 7: Return resolution with full audit trail
 */

// ============================================================================
// MAIN RESOLUTION FUNCTION
// ============================================================================

/**
 * Resolve expiry date from multiple sources
 * 
 * @param sources - All available expiry sources
 * @param currentDate - Current date for status calculation (default: now)
 * @returns ExpiryResolution with full audit trail
 */
export function resolveExpiry(
  sources: ExpirySourceInput[],
  currentDate: Date = new Date()
): ExpiryResolution {
  
  // Handle no sources
  if (sources.length === 0) {
    return createUnknownResolution('No data sources available', sources, currentDate);
  }
  
  // STEP 1 & 2: Sort sources by authority (highest first)
  const sortedSources = [...sources].sort((a, b) => b.authority - a.authority);
  
  // STEP 3: Detect conflicts between sources
  const conflicts = detectConflicts(sortedSources);
  
  // STEP 4: Find primary source (highest authority with expiry date)
  const sourcesWithExpiry = sortedSources.filter(s => s.expiryDate !== null);
  
  if (sourcesWithExpiry.length === 0) {
    // Try to infer from manufacturing date + typical shelf life
    const sourcesWithMfg = sortedSources.filter(s => s.manufacturingDate !== null);
    if (sourcesWithMfg.length > 0) {
      return createInferredResolution(sourcesWithMfg[0], conflicts, sources, currentDate);
    }
    
    return createUnknownResolution('No expiry date in any source', sources, currentDate);
  }
  
  const primarySource = sourcesWithExpiry[0];
  const resolvedExpiryDate = primarySource.expiryDate!;
  
  // STEP 5: Calculate status
  const daysUntilExpiry = calculateDaysUntilExpiry(resolvedExpiryDate, currentDate);
  const status = determineExpiryStatus(daysUntilExpiry);
  
  // STEP 6: Determine review requirements and SAFE eligibility
  const hasUnresolvedConflicts = conflicts.some(c => c.resolution === 'MANUAL_REQUIRED');
  const reviewReasons: string[] = [];
  
  if (hasUnresolvedConflicts) {
    reviewReasons.push('Conflicting expiry dates require manual review');
  }
  
  if (primarySource.authority < 60) {
    reviewReasons.push(`Low authority source (${primarySource.authority}) - verify expiry date`);
  }
  
  if (primarySource.isCalculated) {
    reviewReasons.push('Expiry date was calculated, not printed - verify accuracy');
  }
  
  // Determine if this blocks SAFE
  const blockedSafeReason = determineBlockedSafeReason(
    primarySource,
    hasUnresolvedConflicts,
    status
  );
  
  // STEP 7: Build resolution
  return {
    resolvedExpiryDate,
    primarySource: primarySource.source,
    primaryAuthority: primarySource.authority,
    
    status,
    daysUntilExpiry,
    
    hadConflict: conflicts.length > 0,
    conflicts,
    
    requiresManualReview: reviewReasons.length > 0,
    reviewReasons,
    
    canContributeToSafe: blockedSafeReason === null,
    blockedSafeReason,
    
    allSourcesConsidered: sources,
    resolutionTimestamp: currentDate,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect conflicts between expiry sources
 */
function detectConflicts(sortedSources: ExpirySourceInput[]): ExpiryConflict[] {
  const conflicts: ExpiryConflict[] = [];
  const sourcesWithExpiry = sortedSources.filter(s => s.expiryDate !== null);
  
  // Compare each pair
  for (let i = 0; i < sourcesWithExpiry.length; i++) {
    for (let j = i + 1; j < sourcesWithExpiry.length; j++) {
      const sourceA = sourcesWithExpiry[i];
      const sourceB = sourcesWithExpiry[j];
      
      const conflictResult = checkForConflict(
        sourceA.expiryDate!,
        sourceB.expiryDate!,
        sourceA.authority,
        sourceB.authority
      );
      
      if (conflictResult.hasConflict) {
        conflicts.push({
          field: 'expiryDate',
          sourceA: {
            source: sourceA.source,
            authority: sourceA.authority,
            value: sourceA.expiryDate!,
          },
          sourceB: {
            source: sourceB.source,
            authority: sourceB.authority,
            value: sourceB.expiryDate!,
          },
          daysDifference: conflictResult.daysDifference!,
          resolution: conflictResult.resolution === 'USE_HIGHER_AUTHORITY' 
            ? 'HIGHER_AUTHORITY' 
            : conflictResult.resolution === 'MANUAL_REQUIRED'
              ? 'MANUAL_REQUIRED'
              : 'MORE_RECENT',
          resolvedTo: sourceA.authority >= sourceB.authority 
            ? sourceA.expiryDate 
            : sourceB.expiryDate,
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Calculate days until expiry
 */
function calculateDaysUntilExpiry(expiryDate: Date, currentDate: Date): number {
  const diffMs = expiryDate.getTime() - currentDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine expiry status from days remaining
 */
function determineExpiryStatus(
  daysUntilExpiry: number
): 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN' {
  if (daysUntilExpiry < 0) {
    return 'EXPIRED';
  } else if (daysUntilExpiry <= 7) {
    return 'EXPIRING_SOON';
  } else {
    return 'VALID';
  }
}

/**
 * Determine if this resolution blocks SAFE verdict
 */
function determineBlockedSafeReason(
  primarySource: ExpirySourceInput,
  hasUnresolvedConflicts: boolean,
  status: string
): string | null {
  
  if (hasUnresolvedConflicts) {
    return 'Cannot confirm safe: Conflicting expiry dates from multiple sources';
  }
  
  if (primarySource.authority < 60) {
    return `Cannot confirm safe: Expiry source authority too low (${primarySource.authority})`;
  }
  
  if (primarySource.isCalculated) {
    return 'Cannot confirm safe: Expiry date was calculated, not verified';
  }
  
  if (primarySource.confidence < 0.7) {
    return `Cannot confirm safe: Expiry confidence too low (${(primarySource.confidence * 100).toFixed(0)}%)`;
  }
  
  // EXPIRED blocks safe but through different path (allergen-like AVOID)
  // We don't block here, let decision engine handle EXPIRED → AVOID
  
  return null;
}

/**
 * Create resolution when expiry is unknown
 */
function createUnknownResolution(
  reason: string,
  sources: ExpirySourceInput[],
  currentDate: Date
): ExpiryResolution {
  return {
    resolvedExpiryDate: null,
    primarySource: 'NONE',
    primaryAuthority: 0,
    
    status: 'UNKNOWN',
    daysUntilExpiry: null,
    
    hadConflict: false,
    conflicts: [],
    
    requiresManualReview: true,
    reviewReasons: [reason, 'Manual expiry date entry required'],
    
    canContributeToSafe: false,
    blockedSafeReason: `Cannot confirm safe: ${reason}`,
    
    allSourcesConsidered: sources,
    resolutionTimestamp: currentDate,
  };
}

/**
 * Create resolution with inferred expiry (from MFG date)
 */
function createInferredResolution(
  mfgSource: ExpirySourceInput,
  conflicts: ExpiryConflict[],
  allSources: ExpirySourceInput[],
  currentDate: Date
): ExpiryResolution {
  // Default shelf life assumption (30 days) - very conservative
  // In production, this would use product category lookup
  const DEFAULT_SHELF_LIFE_DAYS = 30;
  
  const inferredExpiry = new Date(mfgSource.manufacturingDate!);
  inferredExpiry.setDate(inferredExpiry.getDate() + DEFAULT_SHELF_LIFE_DAYS);
  
  const daysUntilExpiry = calculateDaysUntilExpiry(inferredExpiry, currentDate);
  const status = determineExpiryStatus(daysUntilExpiry);
  
  return {
    resolvedExpiryDate: inferredExpiry,
    primarySource: `${mfgSource.source}_INFERRED`,
    primaryAuthority: Math.max(10, mfgSource.authority - 30), // Heavily penalize inferred
    
    status,
    daysUntilExpiry,
    
    hadConflict: conflicts.length > 0,
    conflicts,
    
    requiresManualReview: true,
    reviewReasons: [
      'Expiry date was inferred from manufacturing date',
      `Assumed ${DEFAULT_SHELF_LIFE_DAYS} day shelf life - verify with actual product`,
    ],
    
    canContributeToSafe: false, // Inferred dates NEVER allow SAFE
    blockedSafeReason: 'Cannot confirm safe: Expiry date was inferred, not verified',
    
    allSourcesConsidered: allSources,
    resolutionTimestamp: currentDate,
  };
}

// ============================================================================
// OCR INTEGRATION
// ============================================================================

/**
 * Add OCR result to existing sources and resolve
 * 
 * This is the main integration point between OCR and expiry resolution
 */
export function resolveExpiryWithOCR(
  existingSources: ExpirySourceInput[],
  ocrResult: OCRResult,
  currentDate: Date = new Date()
): ExpiryResolution {
  
  // Check if OCR can contribute
  const authorityCheck = checkOCRAuthorityForExpiry(ocrResult, existingSources);
  
  // Convert OCR to source input
  const ocrSource = convertOCRToExpiryInput(ocrResult);
  
  // Build combined sources
  const allSources = [...existingSources];
  
  if (ocrSource && authorityCheck.canContribute) {
    // Adjust authority based on rules
    ocrSource.authority = authorityCheck.adjustedAuthority;
    allSources.push(ocrSource);
  }
  
  // Resolve with all sources
  const resolution = resolveExpiry(allSources, currentDate);
  
  // Add OCR-specific review reasons
  if (authorityCheck.requiresManualReview && authorityCheck.reviewReason) {
    resolution.requiresManualReview = true;
    resolution.reviewReasons.push(authorityCheck.reviewReason);
  }
  
  // If OCR couldn't contribute, note why
  if (!authorityCheck.canContribute) {
    resolution.reviewReasons.push(`OCR not used: ${authorityCheck.reason}`);
  }
  
  return resolution;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick check: Is product expired based on available data?
 */
export function isExpired(resolution: ExpiryResolution): boolean {
  return resolution.status === 'EXPIRED';
}

/**
 * Quick check: Is product expiring soon?
 */
export function isExpiringSoon(resolution: ExpiryResolution): boolean {
  return resolution.status === 'EXPIRING_SOON';
}

/**
 * Quick check: Can we trust the expiry date?
 */
export function canTrustExpiry(resolution: ExpiryResolution): boolean {
  return (
    resolution.resolvedExpiryDate !== null &&
    resolution.primaryAuthority >= 60 &&
    !resolution.hadConflict &&
    !resolution.requiresManualReview
  );
}

/**
 * Get expiry warning message for UX
 */
export function getExpiryWarning(resolution: ExpiryResolution): string | null {
  if (resolution.status === 'EXPIRED') {
    return 'This product has expired';
  }
  
  if (resolution.status === 'EXPIRING_SOON') {
    return `Expires in ${resolution.daysUntilExpiry} day${resolution.daysUntilExpiry === 1 ? '' : 's'}`;
  }
  
  if (resolution.status === 'UNKNOWN') {
    return 'Expiry date could not be determined';
  }
  
  if (resolution.requiresManualReview) {
    return 'Expiry date needs verification';
  }
  
  return null;
}
