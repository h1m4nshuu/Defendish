// ============================================================================
// DEFENDISH UX LAYER - COPY LIBRARY
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Approved UX copy for all scenarios
// Language: Calm, factual, non-alarming, no medical claims
// ============================================================================

/**
 * UX COPY GUIDELINES
 * 
 * ✓ DO:
 *   - Be factual and specific
 *   - Explain what we found
 *   - Explain what we couldn't verify
 *   - Give clear next steps
 *   - Respect user intelligence
 * 
 * ✗ DON'T:
 *   - Make medical claims ("safe to eat")
 *   - Use alarming language ("DANGER", "WARNING")
 *   - Give false reassurance
 *   - Be vague about uncertainty
 *   - Blame the user
 */

// ============================================================================
// VERDICT COPY
// ============================================================================

/**
 * Verdict headlines
 * Format: "{Verdict} for {Profile Name}"
 */
export const VERDICT_COPY = {
  // ===== SAFE =====
  SAFE: {
    headline: (name: string) => `Safe for ${name}`,
    subheadlines: {
      default: 'No allergens detected',
      highConfidence: 'All ingredients verified',
      barcodeMatched: 'Product verified via barcode',
    },
    primaryReasons: {
      default: (count: number) => `Verified ${count} ingredients against allergen profile`,
      barcodeSource: 'Product data from verified database',
      userConfirmed: 'Previously verified by you',
    },
  },
  
  // ===== AVOID =====
  AVOID: {
    headline: (name: string) => `Not safe for ${name}`,
    subheadlines: {
      allergenSingle: 'Allergen detected',
      allergenMultiple: (count: number) => `${count} allergens detected`,
      expired: 'Product has expired',
    },
    primaryReasons: {
      allergenFound: (ingredient: string, allergen: string) => 
        `${ingredient} contains ${allergen}`,
      derivedAllergen: (ingredient: string, allergen: string) => 
        `${ingredient} is derived from ${allergen}`,
      expired: 'This product is past its expiry date',
      expiredDays: (days: number) => `Expired ${days} day(s) ago`,
    },
  },
  
  // ===== VERIFY =====
  VERIFY: {
    headline: (name: string) => `Check before giving to ${name}`,
    subheadlines: {
      possibleAllergen: 'Possible allergen detected',
      unknownIngredients: 'Some ingredients not recognized',
      unknownExpiry: 'Expiry date needs verification',
      lowConfidence: 'Could not fully verify',
      conflict: 'Data needs verification',
    },
    primaryReasons: {
      mayContain: (allergen: string) => 
        `Package indicates it may contain ${allergen}`,
      traceWarning: (allergen: string) => 
        `May contain traces of ${allergen}`,
      unknownIngredients: (count: number) => 
        `${count} ingredient(s) could not be verified`,
      ocrLowConfidence: 'Package scan was unclear',
      noExpiryFound: 'Could not find expiry date on package',
      conflictingData: 'Different sources show different information',
    },
  },
};

// ============================================================================
// ALLERGEN COPY
// ============================================================================

export const ALLERGEN_COPY = {
  // Risk level prefixes (factual, not alarming)
  riskPrefix: {
    DEFINITE: 'Contains',
    DERIVED: 'Contains (derived from)',
    POSSIBLE: 'May contain',
    TRACE: 'May contain traces of',
  },
  
  // Explanation templates
  explanations: {
    directMatch: (ingredient: string, allergen: string) => 
      `"${ingredient}" is a ${allergen} product`,
    derivedMatch: (ingredient: string, source: string) => 
      `"${ingredient}" is derived from ${source}`,
    synonymMatch: (found: string, canonical: string, allergen: string) => 
      `"${found}" (${canonical}) contains ${allergen}`,
    mayContainLabel: (allergen: string) => 
      `Package states: "may contain ${allergen}"`,
    sharedFacility: (allergen: string) => 
      `Made in a facility that also processes ${allergen}`,
    riskPhrase: (phrase: string) => 
      `Package warning: "${phrase}"`,
  },
  
  // No allergen found messages
  noAllergenFound: {
    highConfidence: 'No allergens from your profile detected',
    mediumConfidence: 'No allergens detected in readable ingredients',
    lowConfidence: 'Unable to verify all ingredients',
  },
};

// ============================================================================
// EXPIRY COPY
// ============================================================================

export const EXPIRY_COPY = {
  // Status labels
  status: {
    VALID: 'Within date',
    EXPIRING_SOON: 'Expiring soon',
    EXPIRED: 'Past expiry date',
    UNKNOWN: 'Expiry not verified',
  },
  
  // Date display templates
  display: {
    valid: (date: string, days: number) => 
      `Expires: ${date} (${days} days)`,
    expiringSoon: (date: string, days: number) => 
      `Expires: ${date} (${days} day${days === 1 ? '' : 's'} remaining)`,
    expired: (date: string, days: number) => 
      `Expired: ${date} (${days} day${days === 1 ? '' : 's'} ago)`,
    unknown: 'Expiry date could not be determined',
  },
  
  // Origin explanations (printed vs calculated)
  origin: {
    PRINTED: 'from package label',
    CALCULATED: 'estimated from manufacturing date',
    DATABASE: 'from product database',
    USER_ENTERED: 'entered by you',
    UNKNOWN: 'source unknown',
  },
  
  // Uncertainty messages
  uncertainty: {
    calculatedWarning: 'This date was estimated, not printed on package',
    lowConfidenceWarning: 'Date may not be accurate - please verify',
    noDateFound: 'No expiry date found on package',
    ambiguousFormat: 'Date format was unclear',
  },
};

// ============================================================================
// CONFIDENCE COPY
// ============================================================================

export const CONFIDENCE_COPY = {
  // Level descriptions
  levels: {
    HIGH: 'High confidence based on verified data',
    MEDIUM: 'Moderate confidence - some uncertainty',
    LOW: 'Low confidence - please verify',
  },
  
  // Source explanations
  sources: {
    BARCODE_DATABASE: 'Verified product database',
    MANUFACTURER_QR: 'Manufacturer data',
    USER_CONFIRMED: 'Your verification',
    OCR_HIGH_CONFIDENCE: 'Clear package scan',
    OCR_MEDIUM_CONFIDENCE: 'Package scan',
    OCR_LOW_CONFIDENCE: 'Partial package scan',
    SYSTEM_INFERRED: 'System estimate',
    UNKNOWN: 'Unknown source',
  },
  
  // Low confidence explanations
  lowConfidenceReasons: {
    blurryImage: 'Package scan was blurry',
    partialText: 'Only part of label was readable',
    unknownIngredients: 'Some ingredients not recognized',
    noBarcode: 'No barcode match found',
    conflictingData: 'Multiple sources disagree',
  },
};

// ============================================================================
// ACTION BUTTON COPY
// ============================================================================

export const ACTION_COPY = {
  // Button labels
  buttons: {
    viewDetails: 'View Details',
    verifyManually: 'Verify Manually',
    markSafe: "I've checked - it's safe",
    markUnsafe: 'Mark as Unsafe',
    rescan: 'Scan Again',
    editDate: 'Enter Expiry Date',
    reportIssue: 'Report Issue',
  },
  
  // Confirmation dialogs
  confirmations: {
    markSafe: {
      title: 'Confirm Safe',
      message: 'You\'re confirming this product is safe based on your own verification. This will override the system\'s uncertainty.',
      confirmButton: 'Yes, it\'s safe',
      cancelButton: 'Cancel',
    },
    markUnsafe: {
      title: 'Mark as Unsafe',
      message: 'Mark this product as unsafe for this profile?',
      confirmButton: 'Mark Unsafe',
      cancelButton: 'Cancel',
    },
  },
};

// ============================================================================
// BLOCKED SAFE REASON COPY
// ============================================================================

export const BLOCKED_SAFE_COPY = {
  // Why SAFE was blocked (shown under VERIFY verdict)
  reasons: {
    allergenDetected: (allergen: string) => `Contains ${allergen}`,
    possibleAllergen: (allergen: string) => `May contain ${allergen}`,
    expired: 'Product has expired',
    expiryUnknown: 'Expiry date not verified',
    unknownIngredients: (count: number) => `${count} ingredient(s) not recognized`,
    conflictingData: 'Data sources disagree',
    lowConfidence: 'Not enough data to confirm',
    ocrFailed: 'Could not read package clearly',
  },
  
  // Intro for blocked reasons list
  intro: 'Could not confirm safe because:',
};

// ============================================================================
// ERROR & EDGE CASE COPY
// ============================================================================

export const ERROR_COPY = {
  // Scan failures
  scanFailed: {
    blurry: 'Image was too blurry. Try holding steady.',
    dark: 'Image was too dark. Try better lighting.',
    noText: 'No text detected. Make sure label is visible.',
    timeout: 'Scan took too long. Please try again.',
  },
  
  // Network issues
  network: {
    offline: 'You\'re offline. Some features may be limited.',
    timeout: 'Request timed out. Check your connection.',
    error: 'Something went wrong. Please try again.',
  },
  
  // Data issues
  data: {
    noProfile: 'No profile selected',
    noProduct: 'Product not found',
    noIngredients: 'No ingredients found',
  },
};

// ============================================================================
// EXAMPLE SCENARIOS
// ============================================================================

/**
 * EXAMPLE UX COPY FOR EACH SCENARIO
 * 
 * These examples show how the copy library maps to real scenarios.
 */

export const EXAMPLE_SCENARIOS = {
  
  // ===== SCENARIO 1: SAFE - All clear =====
  scenario1_safe: {
    facts: {
      canConfirmSafe: true,
      hasDefiniteAllergen: false,
      ingredientCount: 12,
      confidence: 0.95,
    },
    uxOutput: {
      headline: 'Safe for Emma',
      subheadline: 'No allergens detected',
      primaryReason: 'Verified 12 ingredients against allergen profile',
      explanations: [
        '✓ All ingredients verified',
        '✓ Within expiry date',
        '✓ High confidence from product database',
      ],
    },
  },
  
  // ===== SCENARIO 2: AVOID - Allergen found =====
  scenario2_avoid_allergen: {
    facts: {
      canConfirmSafe: false,
      hasDefiniteAllergen: true,
      allergen: { name: 'Peanut', ingredient: 'groundnut oil' },
    },
    uxOutput: {
      headline: 'Not safe for Emma',
      subheadline: 'Allergen detected',
      primaryReason: 'groundnut oil contains peanut',
      explanations: [
        '⚠ Contains peanut',
        '"groundnut oil" is a peanut product',
      ],
    },
  },
  
  // ===== SCENARIO 3: AVOID - Expired =====
  scenario3_avoid_expired: {
    facts: {
      canConfirmSafe: false,
      hasDefiniteAllergen: false,
      expiryStatus: 'EXPIRED',
      daysExpired: 5,
    },
    uxOutput: {
      headline: 'Not safe for Emma',
      subheadline: 'Product has expired',
      primaryReason: 'This product is past its expiry date',
      explanations: [
        '⚠ Expired: Dec 31, 2025 (5 days ago)',
        'Expiry date from package label',
      ],
    },
  },
  
  // ===== SCENARIO 4: VERIFY - May contain =====
  scenario4_verify_mayContain: {
    facts: {
      canConfirmSafe: false,
      hasPossibleAllergen: true,
      allergen: { name: 'Tree Nuts', riskLevel: 'POSSIBLE' },
    },
    uxOutput: {
      headline: 'Check before giving to Emma',
      subheadline: 'Possible allergen detected',
      primaryReason: 'Package indicates it may contain tree nuts',
      explanations: [
        '? May contain tree nuts',
        'Package states: "may contain tree nuts"',
      ],
      blockedSafe: ['May contain tree nuts'],
    },
  },
  
  // ===== SCENARIO 5: VERIFY - Unknown ingredients =====
  scenario5_verify_unknownIngredients: {
    facts: {
      canConfirmSafe: false,
      unknownIngredients: ['E471', 'natural flavors'],
      confidence: 0.6,
    },
    uxOutput: {
      headline: 'Check before giving to Emma',
      subheadline: 'Some ingredients not recognized',
      primaryReason: '2 ingredient(s) could not be verified',
      explanations: [
        '? 2 ingredients not recognized',
        'Could not verify: E471, natural flavors',
      ],
      blockedSafe: ['2 ingredient(s) not recognized'],
    },
  },
  
  // ===== SCENARIO 6: VERIFY - Low confidence =====
  scenario6_verify_lowConfidence: {
    facts: {
      canConfirmSafe: false,
      requiresManualReview: true,
      confidence: 0.35,
      ocrConfidence: 0.4,
    },
    uxOutput: {
      headline: 'Check before giving to Emma',
      subheadline: 'Could not fully verify',
      primaryReason: 'Package scan was unclear',
      explanations: [
        '? Low confidence scan',
        'Only part of label was readable',
      ],
      blockedSafe: ['Not enough data to confirm'],
    },
  },
  
  // ===== SCENARIO 7: VERIFY - Expiry unknown =====
  scenario7_verify_expiryUnknown: {
    facts: {
      canConfirmSafe: false,
      expiryStatus: 'UNKNOWN',
      hasDefiniteAllergen: false,
    },
    uxOutput: {
      headline: 'Check before giving to Emma',
      subheadline: 'Expiry date needs verification',
      primaryReason: 'Could not find expiry date on package',
      explanations: [
        '? Expiry date not verified',
        'No expiry date found on package',
        '✓ No allergens detected in readable ingredients',
      ],
      blockedSafe: ['Expiry date not verified'],
    },
  },
  
  // ===== SCENARIO 8: VERIFY - Calculated expiry =====
  scenario8_verify_calculatedExpiry: {
    facts: {
      canConfirmSafe: false,
      expiryStatus: 'VALID',
      expiryIsCalculated: true,
      hasDefiniteAllergen: false,
    },
    uxOutput: {
      headline: 'Check before giving to Emma',
      subheadline: 'Expiry date estimated',
      primaryReason: 'Expiry date was calculated from manufacturing date',
      explanations: [
        '? Expires: Feb 15, 2026 (estimated)',
        'This date was estimated, not printed on package',
        '✓ No allergens detected',
      ],
      blockedSafe: ['Expiry date was estimated, not verified'],
    },
  },
};

// ============================================================================
// COPY HELPER FUNCTIONS
// ============================================================================

/**
 * Get allergen display text
 */
export function getAllergenDisplayText(
  riskLevel: string,
  allergenName: string
): string {
  const prefix = ALLERGEN_COPY.riskPrefix[riskLevel as keyof typeof ALLERGEN_COPY.riskPrefix] || 'Contains';
  return `${prefix} ${allergenName.toLowerCase()}`;
}

/**
 * Get expiry display text
 */
export function getExpiryDisplayText(
  status: string,
  date: Date | null,
  days: number | null,
  origin: string
): string {
  if (!date) {
    return EXPIRY_COPY.display.unknown;
  }
  
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const originLabel = EXPIRY_COPY.origin[origin as keyof typeof EXPIRY_COPY.origin] || '';
  const daysNum = days ?? 0;
  
  switch (status) {
    case 'EXPIRED':
      return `${EXPIRY_COPY.display.expired(dateStr, Math.abs(daysNum))} (${originLabel})`;
    case 'EXPIRING_SOON':
      return `${EXPIRY_COPY.display.expiringSoon(dateStr, daysNum)} (${originLabel})`;
    default:
      return `${EXPIRY_COPY.display.valid(dateStr, daysNum)} (${originLabel})`;
  }
}

/**
 * Get confidence display text
 */
export function getConfidenceDisplayText(
  level: 'HIGH' | 'MEDIUM' | 'LOW',
  source: string
): string {
  const levelText = CONFIDENCE_COPY.levels[level];
  const sourceText = CONFIDENCE_COPY.sources[source as keyof typeof CONFIDENCE_COPY.sources] || '';
  return sourceText ? `${levelText} (${sourceText})` : levelText;
}
