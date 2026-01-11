# Defendish Allergen Ontology System

## Overview

This directory contains the safety-critical ingredient normalization and allergen detection system for Defendish.

**Guiding Principle:** This system is designed so that **false SAFE results are impossible** under normal operation. When in doubt, it flags for review.

---

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | PostgreSQL schema for ontology tables |
| `types.ts` | TypeScript interfaces for all data structures |
| `ingredientNormalizer.service.ts` | Raw text → Canonical ingredient IDs |
| `allergenDetector.service.ts` | Canonical IDs → Allergen detection |

---

## Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ALLERGEN ONTOLOGY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────┐         ┌────────────────────┐                      │
│  │ allergen_categories│◄────────│ingredient_allergen │                      │
│  │                    │         │       _map         │                      │
│  │ • PEANUT           │         │                    │                      │
│  │ • MILK             │         │ • ingredient_id    │                      │
│  │ • WHEAT            │         │ • allergen_id      │                      │
│  │ • EGG              │         │ • risk_level       │                      │
│  │ • SOY              │         │   (DEFINITE/       │                      │
│  │ • TREE_NUTS        │         │    DERIVED/        │                      │
│  │ • FISH             │         │    POSSIBLE)       │                      │
│  │ • SHELLFISH        │         │                    │                      │
│  │ • SESAME           │         └─────────┬──────────┘                      │
│  └────────────────────┘                   │                                 │
│                                           │                                 │
│                                           ▼                                 │
│  ┌────────────────────┐         ┌────────────────────┐                      │
│  │ingredient_synonyms │────────►│canonical_ingredients│                     │
│  │                    │         │                    │                      │
│  │ • "groundnut" ─────┼────────►│ • peanut           │                      │
│  │ • "cacahuete" ─────┼────────►│ • peanut_oil       │                      │
│  │ • "erdnuss" ───────┼────────►│ • peanut_butter    │                      │
│  │ • "mungfali" ──────┼────────►│ • whey             │                      │
│  │ • "arachis" ───────┼────────►│ • casein           │                      │
│  │                    │         │ • albumin          │                      │
│  └────────────────────┘         └─────────┬──────────┘                      │
│                                           │                                 │
│                                           ▼                                 │
│                                 ┌────────────────────┐                      │
│                                 │compound_ingredients│                      │
│                                 │                    │                      │
│                                 │ whey_protein_conc  │                      │
│                                 │   └── contains:    │                      │
│                                 │       • whey       │                      │
│                                 │       • milk_protein│                     │
│                                 └────────────────────┘                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          risk_phrases                                   │ │
│  │                                                                         │ │
│  │  "may contain" → POSSIBLE (all allergens)                               │ │
│  │  "produced in a facility" → POSSIBLE (all allergens)                    │ │
│  │  "not suitable for nut allergy" → DEFINITE (TREE_NUTS)                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Algorithm: Ingredient Normalization

### Input
```
"Milk, sugar, groundnut oil, wheat flour (contains gluten), may contain traces of nuts"
```

### Step 1: Risk Phrase Detection (BEFORE tokenization)
```
Detected: "may contain traces of" → TRACE risk for ALL profile allergens
Detected: "contains gluten" → DEFINITE risk for GLUTEN
```

### Step 2: Tokenization
```
["milk", "sugar", "groundnut oil", "wheat flour"]
```

### Step 3: Normalization (per token)
```
"milk" 
  → EXACT match in synonymMap
  → canonical_id: "milk"
  → allergen_ids: [MILK]
  → confidence: 1.0

"sugar"
  → EXACT match
  → canonical_id: "sugar"
  → allergen_ids: []
  → confidence: 1.0

"groundnut oil"
  → EXACT match via synonym table (regional: IN)
  → canonical_id: "peanut_oil"
  → allergen_ids: [PEANUT] (DERIVED)
  → confidence: 1.0

"wheat flour"
  → EXACT match
  → canonical_id: "wheat_flour"
  → allergen_ids: [WHEAT]
  → confidence: 1.0
```

### Step 4: Output
```typescript
{
  normalized: [...],
  matched: [...],
  unmatched: [],
  riskPhrasesDetected: [
    { phrase: "may contain traces of", riskType: "CROSS_CONTAMINATION", ... },
    { phrase: "contains gluten", riskType: "CONTAINS_WARNING", ... }
  ],
  overallConfidence: 1.0,
  matchRate: 1.0,
  requiresManualReview: true,  // Due to risk phrases
  reviewReasons: ["Product contains cross-contamination or facility warnings"]
}
```

---

## Algorithm: Allergen Detection

### Input
```
NormalizationResult (from above)
ProfileAllergies: { allergenIds: [PEANUT, MILK] }
```

### Step 1: Check Matched Ingredients
```
"milk" → maps to MILK → PROFILE MATCH → DEFINITE
"peanut_oil" → maps to PEANUT → PROFILE MATCH → DERIVED
"wheat_flour" → maps to WHEAT → NO PROFILE MATCH
```

### Step 2: Check Risk Phrases
```
"may contain traces of" → generic phrase
  → Applies to ALL profile allergens
  → PEANUT: TRACE
  → MILK: TRACE
```

### Step 3: Categorize & Deduplicate
```
definiteAllergens: [MILK (from ingredient)]
possibleAllergens: []
traceAllergens: [PEANUT (from derivative + risk phrase)]
```

### Step 4: Safety Facts
```typescript
{
  containsDefiniteAllergen: true,  // MILK detected
  containsPossibleAllergen: true,  // Risk phrases found
  hasUnknownIngredients: false,
  confidenceLevel: 'MEDIUM'        // Due to risk phrases
}
```

---

## Why This Prevents False SAFE Results

### 1. No Substring Matching
```
WRONG: "peanut".includes("pea") → true (false positive)
RIGHT: synonymMap.has("peanut") → exact lookup only
```

### 2. Unmatched Ingredients Trigger Review
```
If ANY ingredient cannot be resolved → requiresManualReview = true
Unknown ingredients COULD contain allergens
```

### 3. Risk Phrases Captured Before Tokenization
```
"may contain nuts" is detected as a whole phrase
Not split into ["may", "contain", "nuts"]
```

### 4. Conservative Risk Classification
```
Generic "may contain" → flags ALL profile allergens as POSSIBLE
Better to warn about non-issue than miss real risk
```

### 5. Confidence Degradation
```
Each uncertainty factor reduces confidence:
- Unmatched ingredients: confidence *= 0.7
- Risk phrases: confidence *= 0.8
- Low match rate: directly affects confidence
```

### 6. Safety Facts vs UI Labels
```
The detector outputs FACTS:
- containsDefiniteAllergen: true/false
- hasUnknownIngredients: true/false

The UX layer decides:
- SAFE (only if ALL facts are clean)
- AVOID (if definite allergen)
- VERIFY (if any uncertainty)
```

---

## Audit Trail

Every normalization is logged:

```sql
INSERT INTO normalization_audit_log (
  raw_input,
  product_id,
  normalized_result,
  unmatched_tokens,
  risk_phrases_found,
  confidence_score,
  tokens_processed,
  tokens_matched,
  processing_time_ms
) VALUES (...);
```

This enables:
- Debugging false negatives
- Identifying missing synonyms
- Regulatory compliance
- Continuous improvement

---

## Adding New Synonyms

```sql
-- Example: Add Hindi synonym for "cashew"
INSERT INTO ingredient_synonyms (
  synonym, 
  synonym_normalized, 
  canonical_id, 
  language_code, 
  region_code, 
  synonym_type
) VALUES (
  'काजू',
  'काजू',
  (SELECT id FROM canonical_ingredients WHERE canonical_name = 'cashew'),
  'hi',
  'IN',
  'TRANSLATION'
);
```

After adding, call:
```typescript
await initializeOntologyCache(prisma);  // Refresh cache
```

---

## Testing Checklist

Before deployment, verify:

- [ ] "groundnut" → PEANUT allergen
- [ ] "whey protein concentrate" → MILK allergen
- [ ] "may contain nuts" → flags TREE_NUTS as POSSIBLE
- [ ] Unknown ingredient → requiresManualReview = true
- [ ] Empty input → requiresManualReview = true
- [ ] All Big 9 allergens have synonyms
- [ ] Regional names (IN, EU) are mapped

---

## Safety Audit Questions

This system can answer:

1. **Why was this product flagged?**
   → Check `detectionResult.detected[].explanation`

2. **What ingredient triggered the alert?**
   → Check `detectionResult.detected[].sourceDetail`

3. **Was the input fully understood?**
   → Check `normResult.unmatched` and `normResult.matchRate`

4. **Could cross-contamination occur?**
   → Check `normResult.riskPhrasesDetected`

5. **How confident is the system?**
   → Check `normResult.overallConfidence` and `detectionResult.safetyFacts.confidenceLevel`
