// ============================================================================
// DEFENDISH UX LAYER - TYPE DEFINITIONS
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Translate decision engine facts into user-facing verdicts
// Guiding Principle: Never overstate safety, clearly explain uncertainty
// ============================================================================

// ============================================================================
// VERDICT TYPES
// ============================================================================

/**
 * The three possible verdicts shown to users
 * 
 * SAFE    - Product confirmed safe for this profile
 * AVOID   - Product should be avoided (allergen detected or expired)
 * VERIFY  - Cannot confirm safety, manual check required
 * 
 * Note: There is no "UNKNOWN" verdict shown to users.
 * Unknown = VERIFY with appropriate explanation.
 */
export type UserVerdict = 'SAFE' | 'AVOID' | 'VERIFY';

/**
 * Visual styling for each verdict
 */
export const VERDICT_STYLES: Record<UserVerdict, VerdictStyle> = {
  SAFE: {
    backgroundColor: '#E8F5E9',    // Light green
    borderColor: '#4CAF50',        // Green
    iconName: 'checkmark-circle',
    iconColor: '#2E7D32',          // Dark green
    headerColor: '#1B5E20',        // Darker green
  },
  AVOID: {
    backgroundColor: '#FFEBEE',    // Light red
    borderColor: '#F44336',        // Red
    iconName: 'close-circle',
    iconColor: '#C62828',          // Dark red
    headerColor: '#B71C1C',        // Darker red
  },
  VERIFY: {
    backgroundColor: '#FFF8E1',    // Light amber
    borderColor: '#FFC107',        // Amber
    iconName: 'help-circle',
    iconColor: '#F57F17',          // Dark amber
    headerColor: '#E65100',        // Orange
  },
};

export interface VerdictStyle {
  backgroundColor: string;
  borderColor: string;
  iconName: string;
  iconColor: string;
  headerColor: string;
}

// ============================================================================
// EXPLANATION TYPES
// ============================================================================

/**
 * Severity level for explanation items
 */
export type ExplanationSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

/**
 * A single explanation item shown to user
 */
export interface ExplanationItem {
  /** Icon to display */
  icon: string;
  
  /** Main text - always shown */
  text: string;
  
  /** Supporting detail - shown on expand */
  detail: string | null;
  
  /** Severity affects styling */
  severity: ExplanationSeverity;
  
  /** Category for grouping */
  category: 'ALLERGEN' | 'EXPIRY' | 'CONFIDENCE' | 'CONFLICT' | 'GENERAL';
}

/**
 * Date origin explanation
 */
export type DateOrigin = 'PRINTED' | 'CALCULATED' | 'DATABASE' | 'USER_ENTERED' | 'UNKNOWN';

/**
 * Date origin display text
 */
export const DATE_ORIGIN_LABELS: Record<DateOrigin, string> = {
  PRINTED: 'from package label',
  CALCULATED: 'estimated from manufacturing date',
  DATABASE: 'from product database',
  USER_ENTERED: 'entered by you',
  UNKNOWN: 'source unknown',
};

// ============================================================================
// UX DECISION OUTPUT
// ============================================================================

/**
 * Complete UX decision output
 * This is what the mobile app receives and renders
 */
export interface UXDecisionOutput {
  // ==================== VERDICT ====================
  
  /** The verdict shown to user */
  verdict: UserVerdict;
  
  /** Styling for the verdict */
  style: VerdictStyle;
  
  // ==================== HEADLINE ====================
  
  /** Main headline text (e.g., "Safe for Emma") */
  headline: string;
  
  /** Subheadline text (e.g., "No allergens detected") */
  subheadline: string;
  
  // ==================== EXPLANATIONS ====================
  
  /** Primary reason for the verdict */
  primaryReason: string;
  
  /** List of explanation items */
  explanations: ExplanationItem[];
  
  /** What blocked SAFE (if applicable) */
  blockedSafeReasons: string[];
  
  // ==================== EXPIRY INFO ====================
  
  /** Expiry display text */
  expiryDisplay: string | null;
  
  /** Days until expiry (null if unknown) */
  daysUntilExpiry: number | null;
  
  /** How the date was determined */
  dateOrigin: DateOrigin;
  
  // ==================== ACTIONS ====================
  
  /** Actions user can take */
  actions: UXAction[];
  
  // ==================== CONFIDENCE ====================
  
  /** Confidence level in plain language */
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  
  /** Confidence explanation */
  confidenceExplanation: string;
  
  // ==================== META ====================
  
  /** Timestamp of decision */
  timestamp: Date;
  
  /** Decision ID for support/debugging */
  decisionId: string;
}

/**
 * Action button for user
 */
export interface UXAction {
  /** Button label */
  label: string;
  
  /** Action type for handling */
  type: 'MARK_SAFE' | 'MARK_UNSAFE' | 'VERIFY_MANUALLY' | 'RESCAN' | 'EDIT_DATE' | 'VIEW_DETAILS' | 'REPORT_ISSUE';
  
  /** Is this the primary action? */
  isPrimary: boolean;
  
  /** Button style */
  style: 'PRIMARY' | 'SECONDARY' | 'DANGER' | 'TEXT';
}

// ============================================================================
// LANGUAGE CONSTANTS
// ============================================================================

/**
 * Language guidelines for UX copy
 * 
 * ✓ Calm and factual
 * ✓ Clear about uncertainty
 * ✓ Action-oriented
 * ✗ No medical claims
 * ✗ No false reassurance
 * ✗ No alarming language
 */

/**
 * Verdict headlines by profile
 */
export const VERDICT_HEADLINES: Record<UserVerdict, (profileName: string) => string> = {
  SAFE: (name) => `Safe for ${name}`,
  AVOID: (name) => `Not safe for ${name}`,
  VERIFY: (name) => `Check before giving to ${name}`,
};

/**
 * Confidence level descriptions
 */
export const CONFIDENCE_DESCRIPTIONS: Record<string, string> = {
  HIGH: 'High confidence based on verified product data',
  MEDIUM: 'Moderate confidence - some data from package scan',
  LOW: 'Low confidence - please verify before consuming',
};

// ============================================================================
// ALLERGEN DISPLAY
// ============================================================================

/**
 * Risk level display labels
 * Factual, not alarming
 */
export const RISK_LEVEL_LABELS: Record<string, string> = {
  DEFINITE: 'Contains',
  DERIVED: 'Contains (derived from)',
  POSSIBLE: 'May contain',
  TRACE: 'May contain traces of',
};

/**
 * Risk level icons
 */
export const RISK_LEVEL_ICONS: Record<string, string> = {
  DEFINITE: 'alert-circle',
  DERIVED: 'alert-circle',
  POSSIBLE: 'help-circle',
  TRACE: 'information-circle',
};

// ============================================================================
// EXPIRY DISPLAY
// ============================================================================

/**
 * Expiry status labels
 */
export const EXPIRY_STATUS_LABELS: Record<string, string> = {
  VALID: 'Within date',
  EXPIRING_SOON: 'Expiring soon',
  EXPIRED: 'Past expiry date',
  UNKNOWN: 'Expiry unknown',
};

/**
 * Expiry status icons
 */
export const EXPIRY_STATUS_ICONS: Record<string, string> = {
  VALID: 'checkmark-circle',
  EXPIRING_SOON: 'time',
  EXPIRED: 'close-circle',
  UNKNOWN: 'help-circle',
};
