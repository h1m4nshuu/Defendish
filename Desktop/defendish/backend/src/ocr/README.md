# Defendish OCR System

## Overview

The OCR system extracts expiry dates from product images with **honest uncertainty reporting**. It integrates with the authority-based decision engine to ensure safety.

**Core Principles:**
- Never silently fail (null without explanation is FORBIDDEN)
- Never overstate certainty
- Integrate cleanly with authority hierarchy
- Block SAFE verdict when appropriate

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IMAGE CAPTURE                             │
│  (Mobile camera / Gallery selection)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 IMAGE QUALITY ASSESSMENT                     │
│  - Sharpness check                                          │
│  - Brightness/contrast validation                           │
│  - Text clarity estimation                                  │
│  → Returns: isProcessable + issues[]                        │
└─────────────────────────────────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
     ┌──────────────────┐         ┌──────────────────┐
     │  PROCESSABLE     │         │  NOT PROCESSABLE │
     │  Continue OCR    │         │  Return failure  │
     └──────────────────┘         │  with reason     │
               │                   └──────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TESSERACT OCR ENGINE                       │
│  - Extract all text                                         │
│  - Get confidence scores per word                           │
│  - Get bounding boxes                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATE EXTRACTION                           │
│  - Find date patterns (DD/MM/YY, YYYY-MM-DD, etc.)          │
│  - Find date type indicators (EXP, MFG, BB)                 │
│  - Calculate confidence for each date                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESULT CONSTRUCTION                         │
│  - Build OCRResult with all required fields                 │
│  - Generate UX explanation                                  │
│  - Calculate authority level from confidence                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                EXPIRY RESOLUTION SERVICE                     │
│  - Combine OCR with other sources                           │
│  - Apply authority rules                                    │
│  - Detect and resolve conflicts                             │
│  - Determine if SAFE is blocked                             │
└─────────────────────────────────────────────────────────────┘
```

---

## OCR Output Contract

### Success Response

```typescript
{
  success: true,
  sessionId: 'uuid',
  timestamp: Date,
  
  detectedDates: [{
    value: Date,
    type: 'EXP' | 'MFG' | 'BB' | 'PKD' | 'UNKNOWN',
    valueConfidence: 0.0-1.0,
    typeConfidence: 0.0-1.0,
    overallConfidence: 0.0-1.0,
    rawText: 'EXP: 15/02/2026',
    typeIndicator: 'EXP:' | null,
    source: 'PRINTED' | 'CALCULATED',
  }],
  
  authorityLevel: 'OCR_HIGH_CONFIDENCE' | 'OCR_MEDIUM_CONFIDENCE' | 'OCR_LOW_CONFIDENCE',
  overallConfidence: 0.0-1.0,
  
  failureReason: null,  // Must be null on success
  
  uxExplanation: {
    summary: 'Expiry date detected: February 15, 2026',
    uncertaintyReasons: [],
    dateOrigin: 'PRINTED',
    blockedSafeReason: null,
    confidenceExplanation: 'HIGH',
    requiredAction: 'NONE',
    userSuggestions: [],
  }
}
```

### Failure Response

```typescript
{
  success: false,
  sessionId: 'uuid',
  timestamp: Date,
  
  detectedDates: [],  // Empty array, NOT null
  authorityLevel: 'OCR_LOW_CONFIDENCE',
  overallConfidence: 0,
  
  // CRITICAL: Never null on failure
  failureReason: 'IMAGE_TOO_BLURRY',
  failureExplanation: 'Image is too blurry to read text clearly',
  
  partialData: {
    rawTextFragments: ['...xp...'],
    possibleDateFragments: ['26'],
  },
  
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
    ],
  }
}
```

---

## Authority Integration

### Authority Hierarchy

| Rank | Source | Authority Score | OCR Can Override? |
|------|--------|-----------------|-------------------|
| 1 | BARCODE_DATABASE | 100 | ❌ NO |
| 2 | MANUFACTURER_QR | 95 | ❌ NO |
| 3 | USER_CONFIRMED | 80 | ❌ NO |
| 4 | OCR_HIGH_CONFIDENCE | 60 | - |
| 5 | OCR_MEDIUM_CONFIDENCE | 40 | - |
| 6 | OCR_LOW_CONFIDENCE | 20 | - |

### OCR Authority Rules

1. **OCR Cannot Override Higher Authority**
   - Even HIGH confidence OCR (60) cannot override barcode (100) or user (80)
   - Conflicts are logged but higher authority wins

2. **OCR Can Confirm Higher Authority**
   - If OCR agrees with barcode → increased confidence
   - If OCR disagrees → conflict flagged for audit

3. **OCR Can Fill Missing Data**
   - If no higher authority has expiry date → OCR provides it
   - Authority level based on confidence

4. **Low Confidence Triggers Manual Review**
   - OCR confidence < 0.5 → `requiresManualReview = true`
   - User must verify before SAFE can be issued

---

## Confidence → Authority Mapping

```
Confidence ≥ 0.8  →  OCR_HIGH_CONFIDENCE   (authority: 60)
Confidence ≥ 0.5  →  OCR_MEDIUM_CONFIDENCE (authority: 40)
Confidence < 0.5  →  OCR_LOW_CONFIDENCE    (authority: 20)
```

---

## When SAFE is Blocked

OCR blocks SAFE verdict when:

| Condition | Blocked? | Reason |
|-----------|----------|--------|
| OCR failed | ✅ YES | Cannot verify expiry |
| No dates found | ✅ YES | Cannot verify expiry |
| Confidence < 0.5 | ✅ YES | Too uncertain |
| Date type unknown | ✅ YES | Could be MFG date |
| Multiple warnings | ✅ YES | Too many issues |
| Image quality < 0.5 | ✅ YES | Poor image |

---

## Failure Reasons (Enumerated)

### Image Quality Issues
- `IMAGE_TOO_BLURRY`
- `IMAGE_TOO_DARK`
- `IMAGE_TOO_BRIGHT`
- `IMAGE_RESOLUTION_TOO_LOW`
- `NO_TEXT_DETECTED`
- `TEXT_PARTIALLY_VISIBLE`
- `TEXT_OBSCURED`
- `GLARE_DETECTED`
- `MOTION_BLUR`

### Date Parsing Issues
- `NO_DATE_PATTERN_FOUND`
- `AMBIGUOUS_DATE_FORMAT`
- `INVALID_DATE_VALUE`
- `MULTIPLE_CONFLICTING_DATES`
- `DATE_TYPE_UNDETERMINED`
- `PARTIAL_DATE_DETECTED`

### Validation Issues
- `DATE_IN_PAST_BY_YEARS`
- `DATE_TOO_FAR_IN_FUTURE`
- `IMPLAUSIBLE_SHELF_LIFE`

---

## Test Scenarios

### Scenario 1: Blurry Image

**Input:** Camera out of focus, sharpness = 0.15

**Output:**
```
success: false
failureReason: 'IMAGE_TOO_BLURRY'
requiredAction: 'RESCAN'
canContributeToSafe: false
```

**UX Message:** "Could not read the label - image is blurry. Try holding the camera steady."

---

### Scenario 2: Ambiguous Date Format

**Input:** Text reads "01/02/26" with no type indicator

**Output:**
```
success: true
confidence: 0.38
type: 'UNKNOWN'
requiredAction: 'VERIFY_DATE'
canContributeToSafe: false
```

**UX Message:** "Found a date but format is unclear. Date could be January 2 or February 1. Check the package for date format hints."

---

### Scenario 3: OCR Conflicts with Barcode

**Input:**
- Barcode database: 2026-03-15 (authority: 100)
- OCR: 2026-02-15 (authority: 60, confidence: 0.93)

**Output:**
```
resolvedExpiryDate: 2026-03-15 (barcode wins)
hadConflict: true
conflicts: [{ daysDifference: 28, resolution: 'HIGHER_AUTHORITY' }]
canContributeToSafe: true (barcode is trusted)
```

**UX Message:** "Expiry: March 15, 2026 (from product database). Note: Package label shows a different date."

---

## Files

| File | Purpose |
|------|---------|
| [types.ts](types.ts) | OCR result interfaces, failure reasons, UX explanation types |
| [authorityRules.ts](authorityRules.ts) | Authority integration rules, conflict detection |
| [expiryResolution.service.ts](expiryResolution.service.ts) | Multi-source expiry resolution |
| [scenarios.ts](scenarios.ts) | Test scenarios for validation |

---

## Integration with Decision Engine

```typescript
// In product.controller.ts or scan handler

import { resolveExpiryWithOCR } from './ocr/expiryResolution.service';
import { makeDecision } from './decision-engine/decisionEngine.service';

async function handleProductScan(imageData, barcodeData, profileId) {
  // 1. Run OCR on image
  const ocrResult = await runOCR(imageData);
  
  // 2. Get existing sources (barcode DB, previous user confirmation)
  const existingSources = await getExistingSources(barcodeData);
  
  // 3. Resolve expiry with OCR integrated
  const expiryResolution = resolveExpiryWithOCR(existingSources, ocrResult);
  
  // 4. Build decision engine input
  const decisionInput = {
    // ... allergen inputs from ontology
    expiryInputs: [convertResolutionToInput(expiryResolution)],
    // ...
  };
  
  // 5. Get safety decision
  const decision = makeDecision(decisionInput);
  
  // 6. Return to mobile with facts + UX explanation
  return {
    decision,
    ocrExplanation: ocrResult.uxExplanation,
    expiryWarning: getExpiryWarning(expiryResolution),
  };
}
```

---

## Design Principles

1. **Honest Under Poor Conditions**
   - Blurry image → explicit failure, not garbage output
   - Low confidence → reported, not hidden
   - Ambiguity → surfaced to user

2. **Facts, Not Labels**
   - OCR outputs confidence scores, not SAFE/AVOID
   - Decision engine interprets facts
   - UX layer displays verdict

3. **Audit Trail**
   - Every OCR session has unique ID
   - All decisions logged with input snapshot
   - Conflicts recorded for investigation

4. **Safety First**
   - When in doubt → requiresManualReview
   - Low confidence → block SAFE
   - Conflict → flag for user
