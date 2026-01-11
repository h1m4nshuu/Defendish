// ============================================================================
// DEFENDISH INGREDIENT NORMALIZER SERVICE
// Version: 1.0.0
// Date: January 6, 2026
// Purpose: Convert raw ingredient text to canonical ingredient IDs
// Safety Principle: NEVER produce false SAFE - favor UNKNOWN over WRONG
// ============================================================================

import {
  OntologyCache,
  NormalizerInput,
  NormalizationResult,
  NormalizedIngredient,
  DetectedRiskPhrase,
  MatchMethod,
  CanonicalIngredient,
  RiskPhrase,
  IngredientSynonym,
  AllergenCategory,
} from './types';

// ============================================================================
// MODULE-LEVEL CACHE
// Loaded once at startup, refreshed on schema changes
// ============================================================================

let cache: OntologyCache | null = null;

// ============================================================================
// CACHE INITIALIZATION
// ============================================================================

/**
 * Initialize the ontology cache from database
 * MUST be called at server startup before any normalization
 */
export async function initializeOntologyCache(prisma: any): Promise<void> {
  console.log('🔄 Loading allergen ontology into memory cache...');
  const startTime = Date.now();

  // Load all active synonyms
  const synonyms: IngredientSynonym[] = await prisma.ingredientSynonym.findMany({
    where: { isActive: true },
  });

  // Load all active canonical ingredients
  const ingredients: CanonicalIngredient[] = await prisma.canonicalIngredient.findMany({
    where: { isActive: true },
  });

  // Load all ingredient-allergen mappings
  const allergenMaps = await prisma.ingredientAllergenMap.findMany({});

  // Load all active allergen categories
  const allergens: AllergenCategory[] = await prisma.allergenCategory.findMany({
    where: { isActive: true },
  });

  // Load compound ingredients
  const compounds = await prisma.compoundIngredient.findMany({});

  // Load risk phrases
  const riskPhrases: RiskPhrase[] = await prisma.riskPhrase.findMany({
    where: { isActive: true },
    orderBy: { phraseNormalized: 'desc' }, // Longer phrases first for greedy matching
  });

  // Build cache maps
  const synonymMap = new Map<string, string>();
  for (const syn of synonyms) {
    synonymMap.set(syn.synonymNormalized.toLowerCase(), syn.canonicalId);
  }

  // Also add canonical names to synonym map
  for (const ing of ingredients) {
    synonymMap.set(ing.canonicalName.toLowerCase(), ing.id);
    synonymMap.set(ing.displayName.toLowerCase(), ing.id);
  }

  const ingredientMap = new Map<string, CanonicalIngredient>();
  for (const ing of ingredients) {
    ingredientMap.set(ing.id, ing);
  }

  const ingredientAllergenMap = new Map<string, string[]>();
  for (const map of allergenMaps) {
    const existing = ingredientAllergenMap.get(map.ingredientId) || [];
    existing.push(map.allergenId);
    ingredientAllergenMap.set(map.ingredientId, existing);
  }

  const allergenMap = new Map<string, AllergenCategory>();
  const allergenCodeMap = new Map<string, string>();
  for (const alg of allergens) {
    allergenMap.set(alg.id, alg);
    allergenCodeMap.set(alg.code.toUpperCase(), alg.id);
  }

  const compoundMap = new Map<string, string[]>();
  for (const comp of compounds) {
    const existing = compoundMap.get(comp.compoundId) || [];
    existing.push(comp.containsId);
    compoundMap.set(comp.compoundId, existing);
  }

  // Sort risk phrases by length (longest first) for greedy matching
  riskPhrases.sort((a, b) => b.phraseNormalized.length - a.phraseNormalized.length);

  cache = {
    synonymMap,
    ingredientMap,
    ingredientAllergenMap,
    allergenMap,
    allergenCodeMap,
    compoundMap,
    riskPhrases,
    lastUpdated: new Date(),
    synonymCount: synonymMap.size,
    ingredientCount: ingredientMap.size,
    allergenCount: allergenMap.size,
  };

  const elapsed = Date.now() - startTime;
  console.log(`✅ Ontology cache loaded in ${elapsed}ms`);
  console.log(`   Synonyms: ${cache.synonymCount}`);
  console.log(`   Ingredients: ${cache.ingredientCount}`);
  console.log(`   Allergens: ${cache.allergenCount}`);
  console.log(`   Risk Phrases: ${riskPhrases.length}`);
}

/**
 * Get current cache (throws if not initialized)
 */
function getCache(): OntologyCache {
  if (!cache) {
    throw new Error('Ontology cache not initialized. Call initializeOntologyCache() first.');
  }
  return cache;
}

// ============================================================================
// MAIN NORMALIZER FUNCTION
// ============================================================================

/**
 * Normalize raw ingredient text to canonical ingredient IDs
 * 
 * SAFETY PRINCIPLE: This function NEVER produces false SAFE results.
 * - If an ingredient cannot be matched, it is flagged as UNMATCHED
 * - Unmatched ingredients trigger requiresManualReview = true
 * - No substring matching - only exact synonym matches
 * 
 * @param input - Raw ingredient text and metadata
 * @returns Normalization result with matched ingredients and safety flags
 */
export function normalizeIngredients(input: NormalizerInput): NormalizationResult {
  const startTime = Date.now();
  const ontology = getCache();
  
  const result: NormalizationResult = {
    rawInput: input.rawText,
    tokensExtracted: 0,
    normalized: [],
    matched: [],
    unmatched: [],
    riskPhrasesDetected: [],
    overallConfidence: 0,
    matchRate: 0,
    hasUnmatchedTokens: false,
    requiresManualReview: false,
    reviewReasons: [],
    processingTimeMs: 0,
  };

  // Empty input check
  if (!input.rawText || input.rawText.trim().length === 0) {
    result.requiresManualReview = true;
    result.reviewReasons.push('Empty ingredient text provided');
    result.processingTimeMs = Date.now() - startTime;
    return result;
  }

  // STEP 1: Detect risk phrases BEFORE tokenization
  // (Risk phrases span multiple words)
  result.riskPhrasesDetected = detectRiskPhrases(input.rawText, ontology);

  // STEP 2: Tokenize ingredient list
  const tokens = tokenizeIngredients(input.rawText);
  result.tokensExtracted = tokens.length;

  if (tokens.length === 0) {
    result.requiresManualReview = true;
    result.reviewReasons.push('No ingredient tokens could be extracted');
    result.processingTimeMs = Date.now() - startTime;
    return result;
  }

  // STEP 3: Normalize each token
  for (const token of tokens) {
    const normalized = normalizeToken(token, ontology);
    result.normalized.push(normalized);

    if (normalized.matched) {
      result.matched.push(normalized);
    } else {
      result.unmatched.push(normalized.originalToken);
    }
  }

  // STEP 4: Calculate metrics
  result.matchRate = result.matched.length / result.tokensExtracted;
  result.hasUnmatchedTokens = result.unmatched.length > 0;

  // STEP 5: Calculate overall confidence
  if (result.matched.length > 0) {
    const avgConfidence = result.matched.reduce((sum, m) => sum + m.matchConfidence, 0) / result.matched.length;
    result.overallConfidence = avgConfidence * result.matchRate;
  } else {
    result.overallConfidence = 0;
  }

  // STEP 6: Determine if manual review is required
  // SAFETY: Any uncertainty triggers review
  if (result.hasUnmatchedTokens) {
    result.requiresManualReview = true;
    result.reviewReasons.push(`${result.unmatched.length} ingredient(s) could not be identified`);
  }

  if (result.overallConfidence < 0.7) {
    result.requiresManualReview = true;
    result.reviewReasons.push(`Low confidence score: ${Math.round(result.overallConfidence * 100)}%`);
  }

  if (result.riskPhrasesDetected.length > 0) {
    result.requiresManualReview = true;
    result.reviewReasons.push('Product contains cross-contamination or facility warnings');
  }

  result.processingTimeMs = Date.now() - startTime;
  return result;
}

// ============================================================================
// TOKENIZATION
// ============================================================================

/**
 * Tokenize raw ingredient text into individual ingredients
 * 
 * Handles:
 * - Comma, semicolon, and newline separation
 * - Parenthetical content (kept as context but not matched separately)
 * - Common prefixes like "Ingredients:"
 */
function tokenizeIngredients(rawText: string): string[] {
  let text = rawText;

  // Remove common prefixes
  text = text.replace(/^ingredients?\s*:?\s*/i, '');
  text = text.replace(/^contains?\s*:?\s*/i, '');
  text = text.replace(/^made\s+with\s*:?\s*/i, '');

  // Split by common delimiters
  // Note: We do NOT split on parentheses - they provide context
  const rawTokens = text.split(/[,;.\n\r]+/);

  const tokens: string[] = [];

  for (const raw of rawTokens) {
    const cleaned = cleanToken(raw);
    
    // Skip tokens that are too short or too long
    if (cleaned.length >= 2 && cleaned.length <= 100) {
      // Skip common non-ingredient phrases
      if (!isNonIngredientPhrase(cleaned)) {
        tokens.push(cleaned);
      }
    }
  }

  return tokens;
}

/**
 * Clean a single token for matching
 */
function cleanToken(raw: string): string {
  let token = raw.toLowerCase().trim();

  // Remove percentage values (e.g., "milk (3%)" → "milk")
  // But keep the base ingredient
  token = token.replace(/\s*\(\s*\d+(\.\d+)?%?\s*\)/, '');
  
  // Remove standalone percentages
  token = token.replace(/\d+(\.\d+)?%/, '');

  // Normalize whitespace
  token = token.replace(/\s+/g, ' ').trim();

  return token;
}

/**
 * Check if token is a non-ingredient phrase
 */
function isNonIngredientPhrase(token: string): boolean {
  const nonIngredients = [
    'and', 'or', 'the', 'with', 'from', 'including',
    'less than', 'more than', 'approximately',
    'natural', 'artificial', 'flavor', 'flavoring', 'flavour',
    'color', 'colour', 'added',
    'see', 'above', 'below', 'for', 'allergen', 'information',
    'bold', 'highlighted', 'underlined',
  ];

  return nonIngredients.includes(token);
}

// ============================================================================
// TOKEN NORMALIZATION (CORE MATCHING LOGIC)
// ============================================================================

/**
 * Normalize a single ingredient token
 * 
 * MATCHING ORDER (deterministic):
 * 1. Exact match on canonical name
 * 2. Exact match on synonym table
 * 3. Match with common variations removed
 * 4. Match as compound ingredient
 * 5. UNMATCHED (flagged for review)
 * 
 * NO SUBSTRING MATCHING - this prevents false positives
 */
function normalizeToken(token: string, ontology: OntologyCache): NormalizedIngredient {
  const normalized = token.toLowerCase().trim();

  // Result template
  const result: NormalizedIngredient = {
    originalToken: token,
    matched: false,
    canonicalId: null,
    canonicalName: null,
    displayName: null,
    matchConfidence: 0,
    matchMethod: 'UNMATCHED',
    allergenIds: [],
    allergenCodes: [],
  };

  // STEP 1: Direct lookup (canonical name or synonym)
  if (ontology.synonymMap.has(normalized)) {
    const canonicalId = ontology.synonymMap.get(normalized)!;
    return buildMatchResult(result, canonicalId, 1.0, 'EXACT', normalized, ontology);
  }

  // STEP 2: Try with parenthetical content removed
  const withoutParens = normalized.replace(/\s*\([^)]*\)/g, '').trim();
  if (withoutParens !== normalized && ontology.synonymMap.has(withoutParens)) {
    const canonicalId = ontology.synonymMap.get(withoutParens)!;
    return buildMatchResult(result, canonicalId, 0.95, 'SYNONYM', withoutParens, ontology);
  }

  // STEP 3: Try with common prefixes removed
  const prefixes = ['organic', 'natural', 'pure', 'raw', 'dried', 'powdered', 'fresh', 'frozen'];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix + ' ')) {
      const withoutPrefix = normalized.substring(prefix.length + 1).trim();
      if (ontology.synonymMap.has(withoutPrefix)) {
        const canonicalId = ontology.synonymMap.get(withoutPrefix)!;
        return buildMatchResult(result, canonicalId, 0.9, 'SYNONYM', withoutPrefix, ontology);
      }
    }
  }

  // STEP 4: Try word-by-word matching for compound detection
  // Only if the full phrase isn't matched, check if individual words match
  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    // Try progressively shorter phrases from the start
    for (let len = words.length - 1; len >= 2; len--) {
      const phrase = words.slice(0, len).join(' ');
      if (ontology.synonymMap.has(phrase)) {
        const canonicalId = ontology.synonymMap.get(phrase)!;
        return buildMatchResult(result, canonicalId, 0.85, 'COMPOUND', phrase, ontology);
      }
    }

    // Try each word (for compound ingredients like "whey protein concentrate")
    for (const word of words) {
      if (word.length > 3 && ontology.synonymMap.has(word)) {
        const canonicalId = ontology.synonymMap.get(word)!;
        return buildMatchResult(result, canonicalId, 0.75, 'COMPOUND', word, ontology);
      }
    }
  }

  // STEP 5: No match found - DO NOT guess
  // This is a SAFETY feature: unknown ingredients are flagged
  result.matchMethod = 'UNMATCHED';
  result.matchPath = 'No match in ontology';
  return result;
}

/**
 * Build match result with allergen lookup
 */
function buildMatchResult(
  result: NormalizedIngredient,
  canonicalId: string,
  confidence: number,
  method: MatchMethod,
  matchedSynonym: string,
  ontology: OntologyCache
): NormalizedIngredient {
  const ingredient = ontology.ingredientMap.get(canonicalId);
  
  if (!ingredient) {
    // This should never happen if cache is consistent
    result.matchMethod = 'UNMATCHED';
    result.matchPath = 'Canonical ID not found in cache (data inconsistency)';
    return result;
  }

  result.matched = true;
  result.canonicalId = canonicalId;
  result.canonicalName = ingredient.canonicalName;
  result.displayName = ingredient.displayName;
  result.matchConfidence = confidence;
  result.matchMethod = method;
  result.matchedSynonym = matchedSynonym;

  // Get direct allergen mappings
  const allergenIds = ontology.ingredientAllergenMap.get(canonicalId) || [];
  result.allergenIds = [...allergenIds];

  // Also check compound ingredients
  const containsIds = ontology.compoundMap.get(canonicalId);
  if (containsIds) {
    for (const containsId of containsIds) {
      const subAllergenIds = ontology.ingredientAllergenMap.get(containsId) || [];
      for (const allergenId of subAllergenIds) {
        if (!result.allergenIds.includes(allergenId)) {
          result.allergenIds.push(allergenId);
        }
      }
    }
  }

  // Convert allergen IDs to codes for convenience
  result.allergenCodes = result.allergenIds.map(id => {
    const allergen = ontology.allergenMap.get(id);
    return allergen ? allergen.code : 'UNKNOWN';
  });

  result.matchPath = `${method}: "${matchedSynonym}" → ${ingredient.canonicalName}`;

  return result;
}

// ============================================================================
// RISK PHRASE DETECTION
// ============================================================================

/**
 * Detect risk phrases in raw text
 * Uses greedy matching (longest phrase first)
 */
function detectRiskPhrases(rawText: string, ontology: OntologyCache): DetectedRiskPhrase[] {
  const detected: DetectedRiskPhrase[] = [];
  const normalizedText = rawText.toLowerCase();

  for (const riskPhrase of ontology.riskPhrases) {
    const position = normalizedText.indexOf(riskPhrase.phraseNormalized);
    
    if (position !== -1) {
      // Resolve allergen code if specific
      let allergenCode: string | null = null;
      if (riskPhrase.specificAllergenId) {
        const allergen = ontology.allergenMap.get(riskPhrase.specificAllergenId);
        allergenCode = allergen ? allergen.code : null;
      }

      detected.push({
        phrase: riskPhrase.phrase,
        riskType: riskPhrase.riskType,
        specificAllergenId: riskPhrase.specificAllergenId || null,
        specificAllergenCode: allergenCode,
        outputRiskLevel: riskPhrase.outputRiskLevel,
        confidence: riskPhrase.confidence,
        position,
      });
    }
  }

  return detected;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getCache,
  tokenizeIngredients,
  normalizeToken,
  detectRiskPhrases,
};
