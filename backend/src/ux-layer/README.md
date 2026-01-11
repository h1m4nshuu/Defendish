# Defendish UX Truth Translation Layer

## Purpose

Translate decision engine **facts** into user-facing **verdicts** that:
- Never overstate safety
- Clearly explain uncertainty
- Preserve user trust under ambiguity

---

## The Three Verdicts

| Verdict | Meaning | Color | When Shown |
|---------|---------|-------|------------|
| **SAFE** | Confirmed safe for this profile | 🟢 Green | `canConfirmSafe = true` |
| **AVOID** | Should not consume | 🔴 Red | Allergen detected OR expired |
| **VERIFY** | Cannot confirm, check manually | 🟡 Amber | Any uncertainty |

---

## Verdict Decision Table

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ # │ CONDITION                                   │ VERDICT │ PRIORITY │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 │ hasDefiniteAllergen = true                  │ AVOID   │ Highest  │
│ 2 │ expiryStatus = 'EXPIRED'                    │ AVOID   │          │
│ 3 │ hasPossibleAllergen = true                  │ VERIFY  │          │
│ 4 │ expiryStatus = 'UNKNOWN'                    │ VERIFY  │          │
│ 5 │ requiresManualReview = true                 │ VERIFY  │          │
│ 6 │ hasUnresolvedConflicts = true               │ VERIFY  │          │
│ 7 │ hasUnknownIngredients = true                │ VERIFY  │          │
│ 8 │ overallConfidence < 0.5                     │ VERIFY  │          │
│ 9 │ canConfirmSafe = true                       │ SAFE    │          │
│10 │ (default)                                   │ VERIFY  │ Lowest   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Rule:** SAFE only appears when `canConfirmSafe = true` (row 9).

---

## UX Copy Examples

### ✅ SAFE Verdict

```
┌────────────────────────────────────────┐
│ ✓ Safe for Emma                        │
│                                        │
│ No allergens detected                  │
│                                        │
│ Verified 12 ingredients against your   │
│ allergen profile.                      │
│                                        │
│ ✓ All ingredients verified             │
│ ✓ Expires: Mar 15, 2026 (68 days)      │
│ ✓ High confidence from product database│
│                                        │
│              [View Details]            │
└────────────────────────────────────────┘
```

### ❌ AVOID Verdict (Allergen)

```
┌────────────────────────────────────────┐
│ ✗ Not safe for Emma                    │
│                                        │
│ Allergen detected                      │
│                                        │
│ groundnut oil contains peanut          │
│                                        │
│ ⚠ Contains peanut                      │
│   "groundnut oil" is a peanut product  │
│                                        │
│ ✓ Expires: Mar 15, 2026 (68 days)      │
│                                        │
│              [View Details]            │
└────────────────────────────────────────┘
```

### ❌ AVOID Verdict (Expired)

```
┌────────────────────────────────────────┐
│ ✗ Not safe for Emma                    │
│                                        │
│ Product has expired                    │
│                                        │
│ This product is past its expiry date   │
│                                        │
│ ⚠ Expired: Dec 31, 2025 (5 days ago)   │
│   from package label                   │
│                                        │
│ ✓ No allergens detected                │
│                                        │
│              [View Details]            │
└────────────────────────────────────────┘
```

### ⚠️ VERIFY Verdict (May Contain)

```
┌────────────────────────────────────────┐
│ ? Check before giving to Emma          │
│                                        │
│ Possible allergen detected             │
│                                        │
│ Package indicates it may contain       │
│ tree nuts                              │
│                                        │
│ ? May contain tree nuts                │
│   Package states: "may contain tree    │
│   nuts"                                │
│                                        │
│ ── Could not confirm safe because: ──  │
│ • May contain tree nuts                │
│                                        │
│  [Verify Manually]  [I've checked...]  │
└────────────────────────────────────────┘
```

### ⚠️ VERIFY Verdict (Unknown Ingredients)

```
┌────────────────────────────────────────┐
│ ? Check before giving to Emma          │
│                                        │
│ Some ingredients not recognized        │
│                                        │
│ 2 ingredient(s) could not be verified  │
│                                        │
│ ? 2 ingredients not recognized         │
│   Could not verify: E471, natural      │
│   flavors                              │
│                                        │
│ ── Could not confirm safe because: ──  │
│ • 2 ingredient(s) not recognized       │
│                                        │
│  [Verify Manually]  [Scan Again]       │
└────────────────────────────────────────┘
```

### ⚠️ VERIFY Verdict (Low Confidence)

```
┌────────────────────────────────────────┐
│ ? Check before giving to Emma          │
│                                        │
│ Could not fully verify                 │
│                                        │
│ Package scan was unclear               │
│                                        │
│ ? Low confidence scan                  │
│   Only part of label was readable      │
│                                        │
│ ── Could not confirm safe because: ──  │
│ • Not enough data to confirm           │
│                                        │
│  [Verify Manually]  [Scan Again]       │
└────────────────────────────────────────┘
```

### ⚠️ VERIFY Verdict (Expiry Unknown)

```
┌────────────────────────────────────────┐
│ ? Check before giving to Emma          │
│                                        │
│ Expiry date needs verification         │
│                                        │
│ Could not find expiry date on package  │
│                                        │
│ ? Expiry date not verified             │
│   No expiry date found on package      │
│                                        │
│ ✓ No allergens detected in readable    │
│   ingredients                          │
│                                        │
│ ── Could not confirm safe because: ──  │
│ • Expiry date not verified             │
│                                        │
│  [Enter Expiry Date]  [Scan Again]     │
└────────────────────────────────────────┘
```

### ⚠️ VERIFY Verdict (Calculated Expiry)

```
┌────────────────────────────────────────┐
│ ? Check before giving to Emma          │
│                                        │
│ Expiry date estimated                  │
│                                        │
│ Expiry date was calculated from        │
│ manufacturing date                     │
│                                        │
│ ? Expires: Feb 15, 2026 (estimated)    │
│   This date was estimated, not printed │
│   on package                           │
│                                        │
│ ✓ No allergens detected                │
│                                        │
│ ── Could not confirm safe because: ──  │
│ • Expiry date was estimated            │
│                                        │
│  [Edit Date]  [Verify Manually]        │
└────────────────────────────────────────┘
```

---

## Language Constraints

### ✓ DO

| Guideline | Example |
|-----------|---------|
| Be factual | "Contains peanut" |
| Be specific | "2 ingredients not recognized" |
| Explain why | "Could not confirm safe because..." |
| Give actions | "Verify Manually", "Scan Again" |
| Distinguish date sources | "from package label", "estimated" |

### ✗ DON'T

| Guideline | Bad Example | Better |
|-----------|-------------|--------|
| No medical claims | "Safe to eat" | "Safe for Emma" |
| No alarming language | "DANGER!" | "Not safe for Emma" |
| No false reassurance | "Probably fine" | "Check before giving" |
| No vague uncertainty | "Not sure" | "2 ingredients not recognized" |
| No blaming user | "You scanned wrong" | "Package scan was unclear" |

---

## Date Origin Explanations

| Origin | Display Text | When Used |
|--------|--------------|-----------|
| `PRINTED` | "from package label" | OCR extracted date |
| `CALCULATED` | "estimated from manufacturing date" | MFG + shelf life |
| `DATABASE` | "from product database" | Barcode lookup |
| `USER_ENTERED` | "entered by you" | Manual entry |
| `UNKNOWN` | "source unknown" | Cannot determine |

---

## Confidence Levels

| Level | Threshold | Display |
|-------|-----------|---------|
| HIGH | ≥ 0.8 | "High confidence based on verified data" |
| MEDIUM | ≥ 0.5 | "Moderate confidence - some uncertainty" |
| LOW | < 0.5 | "Low confidence - please verify" |

---

## Blocked Safe Reasons

When verdict is VERIFY, show why SAFE was blocked:

```
── Could not confirm safe because: ──
• May contain tree nuts
• 2 ingredient(s) not recognized
• Expiry date not verified
```

Each reason maps to a specific fact:

| Fact | Blocked Safe Reason |
|------|---------------------|
| `hasDefiniteAllergen` | "Contains {allergen}" |
| `hasPossibleAllergen` | "May contain {allergen}" |
| `expiryStatus = EXPIRED` | "Product has expired" |
| `expiryStatus = UNKNOWN` | "Expiry date not verified" |
| `hasUnknownIngredients` | "{n} ingredient(s) not recognized" |
| `hasUnresolvedConflicts` | "Data sources disagree" |
| `overallConfidence < 0.5` | "Not enough data to confirm" |

---

## Action Buttons by Verdict

| Verdict | Primary Action | Secondary Actions |
|---------|----------------|-------------------|
| SAFE | View Details | - |
| AVOID | View Details | Report Issue (for expiry only) |
| VERIFY | Verify Manually | "I've checked - it's safe", Scan Again, Enter Expiry |

**Note:** "Mark Safe" button never appears for AVOID verdicts with allergens.

---

## Files

| File | Purpose |
|------|---------|
| [types.ts](types.ts) | Verdict types, styles, explanation structures |
| [verdictDecision.service.ts](verdictDecision.service.ts) | Decision table implementation |
| [copyLibrary.ts](copyLibrary.ts) | Approved UX copy for all scenarios |

---

## Integration

```typescript
import { translateToUX } from './ux-layer/verdictDecision.service';

// In your product scan handler:
const decisionFacts = await makeDecision(decisionInput);
const uxDecision = translateToUX(decisionFacts, profile.name);

// Send to mobile:
res.json({
  verdict: uxDecision.verdict,
  headline: uxDecision.headline,
  subheadline: uxDecision.subheadline,
  explanations: uxDecision.explanations,
  blockedSafeReasons: uxDecision.blockedSafeReasons,
  actions: uxDecision.actions,
});
```

---

## Design Principles

### 1. Trust Through Honesty

Users trust systems that admit uncertainty more than systems that hide it.

```
❌ "Safe" (when uncertain)
✓ "Check before giving to Emma"
```

### 2. Facts Before Labels

Show what we found, then the verdict:

```
✓ "groundnut oil contains peanut"
  → "Not safe for Emma"
```

Not:

```
❌ "DANGER: ALLERGEN DETECTED"
```

### 3. Actionable Uncertainty

Every VERIFY verdict includes:
- What couldn't be verified
- Why
- What to do about it

### 4. No False Confidence

SAFE only when ALL conditions met:
- No allergens (definite or possible)
- Expiry verified and valid
- All ingredients recognized
- High confidence data
- No conflicts
