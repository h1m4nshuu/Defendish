// ============================================================================
// DEFENDISH DECISION ENGINE - TYPE DEFINITIONS
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Deterministic safety decision engine for multi-source truth
// Safety Principle: Unknown or conflicting data → NEVER assume SAFE
// ============================================================================

// ============================================================================
// SOURCE AUTHORITY TYPES
// ============================================================================

/**
 * Data source types ordered by authority level
 * Higher authority sources CANNOT be overridden by lower authority sources
 */
export type DataSourceType =
  | 'BARCODE_DATABASE'      // Authority: 100 - Verified product database (OpenFoodFacts)
  | 'MANUFACTURER_QR'       // Authority: 95  - Manufacturer-provided QR code
  | 'USER_CONFIRMED'        // Authority: 80  - User manually verified and confirmed
  | 'OCR_HIGH_CONFIDENCE'   // Authority: 60  - OCR with high confidence (>0.8)
  | 'OCR_MEDIUM_CONFIDENCE' // Authority: 40  - OCR with medium confidence (0.5-0.8)
  | 'OCR_LOW_CONFIDENCE'    // Authority: 20  - OCR with low confidence (<0.5)
  | 'SYSTEM_INFERRED'       // Authority: 10  - System calculated/guessed
  | 'UNKNOWN';              // Authority: 0   - Source unknown

/**
 * Authority ranking lookup table
 * Used for conflict resolution - higher number wins
 */
export const AUTHORITY_RANKING: Record<DataSourceType, number> = {
  'BARCODE_DATABASE': 100,
  'MANUFACTURER_QR': 95,
  'USER_CONFIRMED': 80,
  'OCR_HIGH_CONFIDENCE': 60,
  'OCR_MEDIUM_CONFIDENCE': 40,
  'OCR_LOW_CONFIDENCE': 20,
  'SYSTEM_INFERRED': 10,
  'UNKNOWN': 0,
};

/**
 * Minimum authority required for different decision types
 */
export const MINIMUM_AUTHORITY_THRESHOLDS = {
  ALLOW_SAFE_VERDICT: 60,        // Below this, cannot output "definitively safe"
  TRUST_EXPIRY_DATE: 40,         // Below this, expiry requires verification
  TRUST_INGREDIENTS: 60,         // Below this, ingredients require verification
  AUTO_RESOLVE_CONFLICT: 80,     // Below this difference, conflicts need manual review
};

// ============================================================================
// INPUT TYPES - What the engine receives
// ============================================================================

/**
 * Metadata attached to every piece of data
 */
export interface SourceMetadata {
  sourceType: DataSourceType;
  confidence: number;            // 0.0 - 1.0
  timestamp: Date;
  sourceId?: string;             // e.g., barcode number, OCR session ID
  rawValue?: string;             // Original value before processing
}

/**
 * Allergen detection input (from allergenDetector)
 */
export interface AllergenInput {
  allergenId: string;
  allergenCode: string;
  allergenName: string;
  riskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE';
  sourceIngredient: string;
  explanation: string;
  metadata: SourceMetadata;
}

/**
 * Expiry date input
 */
export interface ExpiryInput {
  expiryDate: Date | null;
  manufacturingDate: Date | null;
  bestBeforeDate: Date | null;
  isCalculated: boolean;         // true if derived from MFG + shelf life
  metadata: SourceMetadata;
}

/**
 * Ingredient list input
 */
export interface IngredientInput {
  normalizedIngredients: string[]; // Canonical ingredient IDs
  rawText: string;
  unmatchedCount: number;
  matchConfidence: number;
  metadata: SourceMetadata;
}

/**
 * Complete input to decision engine
 */
export interface DecisionEngineInput {
  // Product identification
  productId?: string;
  productName: string;
  barcode?: string;
  
  // Profile information
  profileId: string;
  profileAllergenIds: string[];
  profileAllergenCodes: string[];
  
  // Data inputs (may have multiple sources)
  allergenInputs: AllergenInput[];
  expiryInputs: ExpiryInput[];
  ingredientInputs: IngredientInput[];
  
  // Request metadata
  requestTimestamp: Date;
  requestSource: 'SCAN' | 'MANUAL_ENTRY' | 'RESCAN' | 'EDIT';
}

// ============================================================================
// OUTPUT TYPES - What the engine produces (FACTS ONLY)
// ============================================================================

/**
 * Detected allergen in output (deduplicated, with source tracking)
 */
export interface DetectedAllergenFact {
  allergenId: string;
  allergenCode: string;
  allergenName: string;
  
  // Risk classification
  riskLevel: 'DEFINITE' | 'DERIVED' | 'POSSIBLE' | 'TRACE';
  
  // Source tracking
  primarySource: DataSourceType;
  allSources: DataSourceType[];
  highestConfidence: number;
  
  // Explanation
  sourceIngredient: string;
  explanation: string;
}

/**
 * Expiry status fact
 */
export interface ExpiryStatusFact {
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
  
  // Date information
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  
  // Source tracking
  source: DataSourceType;
  confidence: number;
  isCalculated: boolean;
  
  // Verification
  requiresVerification: boolean;
  verificationReason?: string;
}

/**
 * Data conflict record
 */
export interface DataConflict {
  field: string;                 // Which field has conflict
  conflictType: 'VALUE_MISMATCH' | 'SOURCE_DISAGREEMENT' | 'MISSING_HIGH_AUTHORITY';
  
  // Conflicting values
  values: {
    source: DataSourceType;
    value: any;
    confidence: number;
    timestamp: Date;
  }[];
  
  // Resolution
  resolution: 'AUTO_RESOLVED' | 'MANUAL_REQUIRED' | 'UNRESOLVED';
  resolvedValue?: any;
  resolutionReason: string;
}

/**
 * Ingredient analysis fact
 */
export interface IngredientAnalysisFact {
  totalIngredients: number;
  matchedIngredients: number;
  unmatchedIngredients: number;
  unmatchedList: string[];
  
  // Source tracking
  primarySource: DataSourceType;
  confidence: number;
  
  // Safety flags
  hasUnknownIngredients: boolean;
  requiresVerification: boolean;
}

/**
 * Complete decision engine output - FACTS ONLY
 * The UX layer translates these facts to SAFE/AVOID/VERIFY labels
 */
export interface DecisionEngineOutput {
  // ==================== CORE FACTS ====================
  
  /**
   * Detected allergens with risk levels
   * Empty array = no allergens detected (but check confidence!)
   */
  allergensDetected: DetectedAllergenFact[];
  
  /**
   * Expiry status
   */
  expiryStatus: ExpiryStatusFact;
  
  /**
   * Ingredient analysis
   */
  ingredientAnalysis: IngredientAnalysisFact;
  
  // ==================== CONFIDENCE & TRUST ====================
  
  /**
   * Overall confidence score (0.0 - 1.0)
   * Factors: source authority, match rates, conflict presence
   */
  overallConfidence: number;
  
  /**
   * Highest authority source used in decision
   */
  primaryDataAuthority: DataSourceType;
  
  /**
   * All data sources that contributed
   */
  dataSources: DataSourceType[];
  
  // ==================== SAFETY FLAGS ====================
  
  /**
   * Does this decision require manual review?
   * TRUE if ANY uncertainty exists
   */
  requiresManualReview: boolean;
  
  /**
   * Why manual review is required
   */
  reviewReasons: string[];
  
  /**
   * Can we confidently say this is safe?
   * FALSE unless ALL conditions are met
   */
  canConfirmSafe: boolean;
  
  /**
   * Is there a definite allergen match?
   */
  hasDefiniteAllergen: boolean;
  
  /**
   * Is there a possible allergen match?
   */
  hasPossibleAllergen: boolean;
  
  // ==================== CONFLICTS ====================
  
  /**
   * Data conflicts detected
   */
  conflicts: DataConflict[];
  
  /**
   * Are there unresolved conflicts?
   */
  hasUnresolvedConflicts: boolean;
  
  // ==================== AUDIT ====================
  
  /**
   * Decision timestamp
   */
  decisionTimestamp: Date;
  
  /**
   * Decision ID for audit trail
   */
  decisionId: string;
  
  /**
   * Input snapshot for audit
   */
  inputSnapshot: {
    profileAllergenCodes: string[];
    ingredientSourceCount: number;
    expirySourceCount: number;
    allergenInputCount: number;
  };
}

// ============================================================================
// SAFETY VERDICT TYPES (for UX layer consumption)
// ============================================================================

/**
 * Safety verdict - computed from facts by UX layer
 * NOT produced by decision engine directly
 */
export type SafetyVerdict = 'SAFE' | 'AVOID' | 'VERIFY' | 'UNKNOWN';

/**
 * UX-ready decision (computed FROM DecisionEngineOutput)
 */
export interface UXDecision {
  verdict: SafetyVerdict;
  verdictReason: string;
  
  // Display information
  allergenWarnings: string[];
  expiryWarning: string | null;
  confidenceDisplay: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Action buttons
  showVerifyButton: boolean;
  showMarkSafeButton: boolean;
  showMarkUnsafeButton: boolean;
  
  // Underlying facts (for advanced users)
  facts: DecisionEngineOutput;
}
