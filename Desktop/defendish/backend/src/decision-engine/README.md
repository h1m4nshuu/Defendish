# Defendish Decision Engine

## Overview

The Decision Engine combines facts from multiple data sources to produce **deterministic safety decisions**. It outputs **facts**, not UI labels.

**Guiding Principle:** Unknown or conflicting data → NEVER assume SAFE.

---

## Authority Ranking Table

| Rank | Source Type | Authority Score | Description |
|------|-------------|-----------------|-------------|
| 1 | `BARCODE_DATABASE` | 100 | Verified product database (OpenFoodFacts) |
| 2 | `MANUFACTURER_QR` | 95 | Manufacturer-provided QR code |
| 3 | `USER_CONFIRMED` | 80 | User manually verified and confirmed |
| 4 | `OCR_HIGH_CONFIDENCE` | 60 | OCR with confidence > 0.8 |
| 5 | `OCR_MEDIUM_CONFIDENCE` | 40 | OCR with confidence 0.5-0.8 |
| 6 | `OCR_LOW_CONFIDENCE` | 20 | OCR with confidence < 0.5 |
| 7 | `SYSTEM_INFERRED` | 10 | System calculated/guessed |
| 8 | `UNKNOWN` | 0 | Source unknown |

---

## Minimum Authority Thresholds

| Decision Type | Minimum Authority | Meaning |
|---------------|-------------------|---------|
| Allow SAFE verdict | 60 | Below this, cannot confirm safe |
| Trust expiry date | 40 | Below this, expiry needs verification |
| Trust ingredients | 60 | Below this, ingredients need verification |
| Auto-resolve conflict | 80 | Below this difference, manual review needed |

---

## Conflict Resolution Rules

### Rule 1: Higher Authority Wins (with caveats)

```
IF authorityDiff >= 80:
    → AUTO_RESOLVED (use higher authority value)
ELSE:
    → MANUAL_REQUIRED (surface conflict to user)
```

### Rule 2: Safety-First Override

Even if higher authority source says "no allergen", if **any source** detects an allergen, we **flag it**:

```
Barcode (auth=100): No milk allergen
OCR (auth=60): Detected "whey protein" → MILK

Result: hasDefiniteAllergen = TRUE
        conflict = "Multiple sources disagree on MILK"
        requiresManualReview = TRUE
```

### Rule 3: Risk Level Always Uses Maximum

If multiple sources report different risk levels for the same allergen:

```
Source A: PEANUT → POSSIBLE
Source B: PEANUT → DEFINITE

Result: PEANUT → DEFINITE (most conservative)
```

---

## Decision Output (Facts Only)

The engine outputs these fields:

```typescript
{
  // ALLERGEN FACTS
  allergensDetected: DetectedAllergenFact[];
  hasDefiniteAllergen: boolean;
  hasPossibleAllergen: boolean;
  
  // EXPIRY FACTS
  expiryStatus: {
    status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
    daysUntilExpiry: number | null;
    requiresVerification: boolean;
  };
  
  // INGREDIENT FACTS
  ingredientAnalysis: {
    totalIngredients: number;
    unmatchedIngredients: number;
    hasUnknownIngredients: boolean;
  };
  
  // CONFIDENCE FACTS
  overallConfidence: number;        // 0.0 - 1.0
  primaryDataAuthority: string;
  
  // SAFETY FLAGS
  requiresManualReview: boolean;
  reviewReasons: string[];
  canConfirmSafe: boolean;
  
  // CONFLICT FACTS
  conflicts: DataConflict[];
  hasUnresolvedConflicts: boolean;
}
```

---

## When `canConfirmSafe = TRUE`

ALL of these must be true:

1. ✅ `hasDefiniteAllergen = FALSE`
2. ✅ `hasPossibleAllergen = FALSE`
3. ✅ `requiresManualReview = FALSE`
4. ✅ `overallConfidence >= 0.7`
5. ✅ `primaryDataAuthority >= 60` (OCR_HIGH or better)
6. ✅ `hasUnknownIngredients = FALSE`
7. ✅ `hasUnresolvedConflicts = FALSE`
8. ✅ `expiryStatus.status != 'EXPIRED'`

**If ANY condition fails → `canConfirmSafe = FALSE`**

---

## Example Scenarios

### Scenario 1: Definite Allergen Match

```
Input:
  - Barcode scan: groundnut oil detected
  - Profile: PEANUT allergy

Output:
  - hasDefiniteAllergen: TRUE
  - canConfirmSafe: FALSE
  - UX Verdict: AVOID
```

### Scenario 2: Low Confidence OCR

```
Input:
  - OCR scan: 60% confidence
  - 2 ingredients unmatched
  - Profile: MILK allergy

Output:
  - hasDefiniteAllergen: FALSE
  - hasUnknownIngredients: TRUE
  - canConfirmSafe: FALSE
  - requiresManualReview: TRUE
  - UX Verdict: VERIFY
```

### Scenario 3: Conflicting Data

```
Input:
  - Barcode: No milk
  - OCR: Detects "whey protein"
  - Profile: MILK allergy

Output:
  - hasDefiniteAllergen: TRUE (safety-first)
  - conflicts: [{ field: 'MILK', ... }]
  - requiresManualReview: TRUE
  - UX Verdict: AVOID (but show conflict)
```

### Scenario 4: Risk Phrase Detected

```
Input:
  - Barcode: No nut ingredients
  - Text: "may contain traces of nuts"
  - Profile: TREE_NUTS allergy

Output:
  - hasDefiniteAllergen: FALSE
  - hasPossibleAllergen: TRUE
  - canConfirmSafe: FALSE
  - UX Verdict: VERIFY
```

### Scenario 5: All Clear

```
Input:
  - Barcode: Rice, salt, oil
  - 100% match rate
  - No allergens
  - Profile: PEANUT allergy

Output:
  - hasDefiniteAllergen: FALSE
  - hasPossibleAllergen: FALSE
  - canConfirmSafe: TRUE
  - UX Verdict: SAFE
```

### Scenario 6: Expired Product

```
Input:
  - Expiry: 2025-12-01 (past)
  - No allergens

Output:
  - hasDefiniteAllergen: FALSE
  - expiryStatus: EXPIRED
  - canConfirmSafe: FALSE
  - UX Verdict: AVOID
```

---

## UX Layer Translation

The UX layer reads `DecisionEngineOutput` and produces a verdict:

```typescript
function deriveVerdict(output: DecisionEngineOutput): SafetyVerdict {
  // AVOID conditions
  if (output.hasDefiniteAllergen) return 'AVOID';
  if (output.expiryStatus.status === 'EXPIRED') return 'AVOID';
  
  // SAFE conditions
  if (output.canConfirmSafe) return 'SAFE';
  
  // Everything else
  return 'VERIFY';
}
```

**The decision engine NEVER outputs "SAFE", "AVOID", or "VERIFY".**

It outputs facts. The UX layer interprets them.

---

## Architecture Separation

```
┌─────────────────────────────────────────────────────────────┐
│                      ONTOLOGY LAYER                          │
│  (ingredientNormalizer + allergenDetector)                  │
│                                                              │
│  Input: Raw text                                             │
│  Output: Canonical IDs, Detected Allergens, Risk Phrases     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DECISION ENGINE                           │
│  (decisionEngine.service.ts)                                │
│                                                              │
│  Input: Multi-source facts (allergens, expiry, ingredients) │
│  Output: Facts (hasDefiniteAllergen, canConfirmSafe, etc.)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       UX LAYER                               │
│  (uxDecision.service.ts - mobile)                           │
│                                                              │
│  Input: DecisionEngineOutput (facts)                         │
│  Output: SafetyVerdict (SAFE / AVOID / VERIFY)              │
└─────────────────────────────────────────────────────────────┘
```

**Why this separation matters:**

1. **Ontology** = What ingredients/allergens exist
2. **Decision Engine** = What the truth is
3. **UX Layer** = How to explain it to users

Each layer can be audited independently.

---

## Audit Trail

Every decision is logged with:

```typescript
{
  decisionId: 'uuid',
  decisionTimestamp: Date,
  inputSnapshot: {
    profileAllergenCodes: string[],
    ingredientSourceCount: number,
    expirySourceCount: number,
  },
  // ... all output fields
}
```

This enables:
- Reconstructing decisions
- Debugging false negatives
- Regulatory compliance
- Continuous improvement
