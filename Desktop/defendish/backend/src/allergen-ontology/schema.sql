-- ============================================================================
-- DEFENDISH ALLERGEN ONTOLOGY SCHEMA
-- Version: 1.0.0
-- Date: January 6, 2026
-- Purpose: Safety-critical ingredient normalization and allergen detection
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: ALLERGEN CATEGORIES
-- The "Big 9" FDA allergens plus regional/emerging allergens
-- This is the ROOT of the allergen hierarchy
-- ============================================================================

CREATE TABLE allergen_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique code for programmatic access (immutable after creation)
    code                VARCHAR(50) UNIQUE NOT NULL,
    
    -- Human-readable name
    name                VARCHAR(100) NOT NULL,
    
    -- Regulatory classification
    regulatory_region   VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',  -- GLOBAL, US, EU, IN, AU
    is_major_allergen   BOOLEAN NOT NULL DEFAULT FALSE,         -- Big 9 = TRUE
    
    -- Severity for UI prioritization
    severity            VARCHAR(20) NOT NULL DEFAULT 'high',    -- critical, high, moderate
    
    -- For auditing
    description         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent accidental deletion
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'moderate')),
    CONSTRAINT valid_region CHECK (regulatory_region IN ('GLOBAL', 'US', 'EU', 'IN', 'AU', 'JP', 'CA'))
);

-- Index for fast lookup by code
CREATE INDEX idx_allergen_code ON allergen_categories(code) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 2: CANONICAL INGREDIENTS
-- The single source of truth for ingredient identity
-- Every ingredient resolves to exactly ONE canonical entry
-- ============================================================================

CREATE TABLE canonical_ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Machine-readable identifier (snake_case, immutable)
    canonical_name      VARCHAR(200) UNIQUE NOT NULL,
    
    -- Human-readable display name
    display_name        VARCHAR(200) NOT NULL,
    
    -- Category for grouping (dairy, nut, grain, etc.)
    category            VARCHAR(100),
    
    -- Whether this is a derivative (peanut_oil vs peanut)
    is_derivative       BOOLEAN NOT NULL DEFAULT FALSE,
    parent_ingredient_id UUID REFERENCES canonical_ingredients(id),
    
    -- Audit fields
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Notes for data maintainers
    notes               TEXT
);

-- Index for fast canonical name lookup
CREATE INDEX idx_canonical_name ON canonical_ingredients(canonical_name) WHERE is_active = TRUE;
CREATE INDEX idx_canonical_category ON canonical_ingredients(category) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 3: INGREDIENT-ALLERGEN MAP
-- Maps canonical ingredients to allergen categories
-- This is the CRITICAL SAFETY TABLE - drives all allergen detection
-- ============================================================================

CREATE TABLE ingredient_allergen_map (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    ingredient_id       UUID NOT NULL REFERENCES canonical_ingredients(id) ON DELETE RESTRICT,
    allergen_id         UUID NOT NULL REFERENCES allergen_categories(id) ON DELETE RESTRICT,
    
    -- Risk classification
    -- DEFINITE: Direct allergen (peanut → PEANUT)
    -- DERIVED: Derivative product (peanut_oil → PEANUT)
    -- POSSIBLE: May trigger in sensitive individuals
    risk_level          VARCHAR(20) NOT NULL DEFAULT 'DEFINITE',
    
    -- Confidence in the mapping (for audit)
    confidence          DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    
    -- Source of this mapping (FDA, manufacturer, research)
    source              VARCHAR(100) NOT NULL DEFAULT 'FDA',
    
    -- Audit fields
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by         VARCHAR(100),
    verified_at         TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate mappings
    UNIQUE(ingredient_id, allergen_id),
    
    CONSTRAINT valid_risk_level CHECK (risk_level IN ('DEFINITE', 'DERIVED', 'POSSIBLE'))
);

-- Critical index for allergen lookup
CREATE INDEX idx_ingredient_allergen ON ingredient_allergen_map(ingredient_id);
CREATE INDEX idx_allergen_ingredient ON ingredient_allergen_map(allergen_id);

-- ============================================================================
-- TABLE 4: INGREDIENT SYNONYMS
-- Maps variant spellings, regional names, and translations to canonical IDs
-- This is where "groundnut" → "peanut" resolution happens
-- ============================================================================

CREATE TABLE ingredient_synonyms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The variant text (stored lowercase for matching)
    synonym             VARCHAR(300) NOT NULL,
    synonym_normalized  VARCHAR(300) NOT NULL,  -- Lowercase, trimmed, no special chars
    
    -- Maps to canonical ingredient
    canonical_id        UUID NOT NULL REFERENCES canonical_ingredients(id) ON DELETE RESTRICT,
    
    -- Language and region for multilingual support
    language_code       VARCHAR(10) NOT NULL DEFAULT 'en',  -- ISO 639-1
    region_code         VARCHAR(10),                         -- ISO 3166-1 alpha-2
    
    -- Match confidence (for synonyms that are approximate)
    confidence          DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    
    -- Type of synonym
    synonym_type        VARCHAR(50) NOT NULL DEFAULT 'EXACT',
    
    -- Source of this synonym
    source              VARCHAR(100) NOT NULL DEFAULT 'MANUAL',
    
    -- Audit fields
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Prevent duplicate synonyms in same language
    UNIQUE(synonym_normalized, language_code),
    
    CONSTRAINT valid_synonym_type CHECK (synonym_type IN (
        'EXACT',        -- Direct match (peanut = peanut)
        'SPELLING',     -- Alternate spelling (colour = color)
        'REGIONAL',     -- Regional name (groundnut = peanut)
        'SCIENTIFIC',   -- Scientific name (arachis hypogaea = peanut)
        'ABBREVIATION', -- Shortened form (MSG = monosodium glutamate)
        'TRANSLATION',  -- Foreign language translation
        'BRAND'         -- Brand name that indicates ingredient
    ))
);

-- Critical index for synonym resolution (case-insensitive)
CREATE INDEX idx_synonym_normalized ON ingredient_synonyms(synonym_normalized) WHERE is_active = TRUE;
CREATE INDEX idx_synonym_canonical ON ingredient_synonyms(canonical_id) WHERE is_active = TRUE;
CREATE INDEX idx_synonym_language ON ingredient_synonyms(language_code, region_code) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 5: COMPOUND INGREDIENTS
-- Maps compound ingredients to their constituent parts
-- e.g., "whey protein concentrate" contains: whey, milk_protein
-- ============================================================================

CREATE TABLE compound_ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The compound ingredient
    compound_id         UUID NOT NULL REFERENCES canonical_ingredients(id) ON DELETE RESTRICT,
    
    -- A constituent ingredient
    contains_id         UUID NOT NULL REFERENCES canonical_ingredients(id) ON DELETE RESTRICT,
    
    -- Whether this component is always present
    is_required         BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Percentage range (if known)
    min_percentage      DECIMAL(5,2),
    max_percentage      DECIMAL(5,2),
    
    -- Audit
    source              VARCHAR(100) NOT NULL DEFAULT 'MANUAL',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(compound_id, contains_id)
);

CREATE INDEX idx_compound_parent ON compound_ingredients(compound_id);
CREATE INDEX idx_compound_child ON compound_ingredients(contains_id);

-- ============================================================================
-- TABLE 6: RISK PHRASES
-- Detects cross-contamination and facility warnings
-- These phrases indicate TRACE or POSSIBLE exposure
-- ============================================================================

CREATE TABLE risk_phrases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The phrase to detect (stored normalized)
    phrase              VARCHAR(300) NOT NULL,
    phrase_normalized   VARCHAR(300) NOT NULL,  -- Lowercase, trimmed
    
    -- Risk classification
    risk_type           VARCHAR(50) NOT NULL,
    
    -- If phrase mentions specific allergen, link it
    -- NULL means applies to ALL allergens in profile
    specific_allergen_id UUID REFERENCES allergen_categories(id),
    
    -- Output risk level when detected
    output_risk_level   VARCHAR(20) NOT NULL DEFAULT 'POSSIBLE',
    
    -- Confidence that this phrase indicates risk
    confidence          DECIMAL(3,2) NOT NULL DEFAULT 0.90,
    
    -- Language support
    language_code       VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Audit
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT valid_risk_type CHECK (risk_type IN (
        'CROSS_CONTAMINATION',  -- "may contain traces of"
        'SHARED_FACILITY',      -- "produced in a facility that also processes"
        'SHARED_EQUIPMENT',     -- "made on equipment that processes"
        'NOT_SUITABLE',         -- "not suitable for X allergy sufferers"
        'CONTAINS_WARNING'      -- "contains X" explicit warning
    )),
    
    CONSTRAINT valid_output_risk CHECK (output_risk_level IN ('DEFINITE', 'POSSIBLE', 'TRACE'))
);

CREATE INDEX idx_risk_phrase_normalized ON risk_phrases(phrase_normalized) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 7: NORMALIZATION AUDIT LOG
-- Tracks every normalization decision for debugging and safety review
-- ============================================================================

CREATE TABLE normalization_audit_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Input
    raw_input           TEXT NOT NULL,
    product_id          UUID,  -- If from a product scan
    
    -- Output
    normalized_result   JSONB NOT NULL,
    unmatched_tokens    TEXT[],
    risk_phrases_found  JSONB,
    
    -- Metrics
    confidence_score    DECIMAL(3,2) NOT NULL,
    tokens_processed    INTEGER NOT NULL,
    tokens_matched      INTEGER NOT NULL,
    
    -- Timing
    processing_time_ms  INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_product ON normalization_audit_log(product_id);
CREATE INDEX idx_audit_date ON normalization_audit_log(created_at);

-- ============================================================================
-- SEED DATA: BIG 9 ALLERGENS (FDA)
-- ============================================================================

INSERT INTO allergen_categories (code, name, is_major_allergen, severity, regulatory_region, description) VALUES
('MILK', 'Milk', TRUE, 'critical', 'GLOBAL', 'Includes all dairy products and derivatives'),
('EGG', 'Eggs', TRUE, 'critical', 'GLOBAL', 'Chicken eggs and derivatives'),
('FISH', 'Fish', TRUE, 'critical', 'GLOBAL', 'All fish species'),
('SHELLFISH', 'Shellfish', TRUE, 'critical', 'GLOBAL', 'Crustaceans and mollusks'),
('TREE_NUTS', 'Tree Nuts', TRUE, 'critical', 'GLOBAL', 'Almonds, cashews, walnuts, etc.'),
('PEANUT', 'Peanuts', TRUE, 'critical', 'GLOBAL', 'Peanuts and groundnuts (legume)'),
('WHEAT', 'Wheat', TRUE, 'critical', 'GLOBAL', 'Wheat and wheat derivatives'),
('SOY', 'Soy', TRUE, 'critical', 'GLOBAL', 'Soybeans and derivatives'),
('SESAME', 'Sesame', TRUE, 'critical', 'GLOBAL', 'Sesame seeds and oil');

-- Additional regional allergens
INSERT INTO allergen_categories (code, name, is_major_allergen, severity, regulatory_region, description) VALUES
('GLUTEN', 'Gluten', FALSE, 'high', 'EU', 'Gluten-containing cereals (broader than wheat)'),
('MUSTARD', 'Mustard', FALSE, 'high', 'EU', 'Mustard seeds and derivatives'),
('CELERY', 'Celery', FALSE, 'high', 'EU', 'Celery and celeriac'),
('LUPIN', 'Lupin', FALSE, 'high', 'EU', 'Lupin beans and flour'),
('MOLLUSCS', 'Molluscs', FALSE, 'high', 'EU', 'Separate from crustacean shellfish'),
('SULPHITES', 'Sulphites', FALSE, 'moderate', 'EU', 'Sulphur dioxide and sulphites > 10mg/kg');

-- ============================================================================
-- SEED DATA: CANONICAL INGREDIENTS (SAMPLE)
-- ============================================================================

-- Peanut family
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('peanut', 'Peanut', 'legume', FALSE),
('peanut_oil', 'Peanut Oil', 'oil', TRUE),
('peanut_butter', 'Peanut Butter', 'spread', TRUE),
('peanut_flour', 'Peanut Flour', 'flour', TRUE);

-- Set parent relationships
UPDATE canonical_ingredients SET parent_ingredient_id = (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut') 
WHERE canonical_name IN ('peanut_oil', 'peanut_butter', 'peanut_flour');

-- Milk family
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('milk', 'Milk', 'dairy', FALSE),
('milk_powder', 'Milk Powder', 'dairy', TRUE),
('whey', 'Whey', 'dairy', TRUE),
('whey_protein_concentrate', 'Whey Protein Concentrate', 'dairy', TRUE),
('casein', 'Casein', 'dairy', TRUE),
('lactose', 'Lactose', 'dairy', TRUE),
('butter', 'Butter', 'dairy', TRUE),
('cream', 'Cream', 'dairy', TRUE),
('cheese', 'Cheese', 'dairy', TRUE),
('ghee', 'Ghee (Clarified Butter)', 'dairy', TRUE);

-- Wheat family
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('wheat', 'Wheat', 'grain', FALSE),
('wheat_flour', 'Wheat Flour', 'grain', TRUE),
('semolina', 'Semolina', 'grain', TRUE),
('bulgur', 'Bulgur', 'grain', TRUE),
('couscous', 'Couscous', 'grain', TRUE),
('gluten', 'Gluten', 'protein', TRUE);

-- Egg family
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('egg', 'Egg', 'protein', FALSE),
('egg_white', 'Egg White', 'protein', TRUE),
('egg_yolk', 'Egg Yolk', 'protein', TRUE),
('albumin', 'Albumin', 'protein', TRUE),
('lysozyme', 'Lysozyme', 'enzyme', TRUE);

-- Soy family
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('soy', 'Soy', 'legume', FALSE),
('soy_lecithin', 'Soy Lecithin', 'emulsifier', TRUE),
('soy_protein', 'Soy Protein', 'protein', TRUE),
('soy_sauce', 'Soy Sauce', 'condiment', TRUE),
('tofu', 'Tofu', 'protein', TRUE),
('tempeh', 'Tempeh', 'protein', TRUE),
('edamame', 'Edamame', 'vegetable', TRUE);

-- Tree nuts
INSERT INTO canonical_ingredients (canonical_name, display_name, category, is_derivative) VALUES
('almond', 'Almond', 'tree_nut', FALSE),
('cashew', 'Cashew', 'tree_nut', FALSE),
('walnut', 'Walnut', 'tree_nut', FALSE),
('pistachio', 'Pistachio', 'tree_nut', FALSE),
('hazelnut', 'Hazelnut', 'tree_nut', FALSE),
('pecan', 'Pecan', 'tree_nut', FALSE),
('macadamia', 'Macadamia', 'tree_nut', FALSE),
('brazil_nut', 'Brazil Nut', 'tree_nut', FALSE),
('pine_nut', 'Pine Nut', 'tree_nut', FALSE);

-- ============================================================================
-- SEED DATA: INGREDIENT-ALLERGEN MAPPINGS
-- ============================================================================

-- Peanut mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'peanut' AND ac.code = 'PEANUT';

INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DERIVED', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('peanut_oil', 'peanut_butter', 'peanut_flour') AND ac.code = 'PEANUT';

-- Milk mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'milk' AND ac.code = 'MILK';

INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DERIVED', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('milk_powder', 'whey', 'whey_protein_concentrate', 'casein', 'lactose', 'butter', 'cream', 'cheese', 'ghee') AND ac.code = 'MILK';

-- Wheat mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'wheat' AND ac.code = 'WHEAT';

INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DERIVED', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('wheat_flour', 'semolina', 'bulgur', 'couscous', 'gluten') AND ac.code = 'WHEAT';

-- Gluten also maps to GLUTEN allergen
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'gluten' AND ac.code = 'GLUTEN';

-- Tree nut mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil_nut', 'pine_nut') AND ac.code = 'TREE_NUTS';

-- Egg mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'egg' AND ac.code = 'EGG';

INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DERIVED', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('egg_white', 'egg_yolk', 'albumin', 'lysozyme') AND ac.code = 'EGG';

-- Soy mappings
INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DEFINITE', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name = 'soy' AND ac.code = 'SOY';

INSERT INTO ingredient_allergen_map (ingredient_id, allergen_id, risk_level, source) 
SELECT ci.id, ac.id, 'DERIVED', 'FDA'
FROM canonical_ingredients ci, allergen_categories ac
WHERE ci.canonical_name IN ('soy_lecithin', 'soy_protein', 'soy_sauce', 'tofu', 'tempeh', 'edamame') AND ac.code = 'SOY';

-- ============================================================================
-- SEED DATA: SYNONYMS (CRITICAL FOR MATCHING)
-- ============================================================================

-- Peanut synonyms (multi-regional)
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('peanut', 'peanut', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', NULL, 'EXACT', 'FDA'),
('peanuts', 'peanuts', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', NULL, 'EXACT', 'FDA'),
('groundnut', 'groundnut', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', 'IN', 'REGIONAL', 'MANUAL'),
('groundnuts', 'groundnuts', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', 'IN', 'REGIONAL', 'MANUAL'),
('ground nut', 'ground nut', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', 'IN', 'REGIONAL', 'MANUAL'),
('arachis', 'arachis', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'en', NULL, 'SCIENTIFIC', 'FDA'),
('arachis hypogaea', 'arachis hypogaea', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'la', NULL, 'SCIENTIFIC', 'FDA'),
('cacahuete', 'cacahuete', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'es', NULL, 'TRANSLATION', 'MANUAL'),
('cacahuetes', 'cacahuetes', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'es', NULL, 'TRANSLATION', 'MANUAL'),
('erdnuss', 'erdnuss', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'de', NULL, 'TRANSLATION', 'MANUAL'),
('arachide', 'arachide', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'fr', NULL, 'TRANSLATION', 'MANUAL'),
('mungfali', 'mungfali', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('moongphali', 'moongphali', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut'), 'hi', 'IN', 'TRANSLATION', 'MANUAL');

-- Peanut oil synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('peanut oil', 'peanut oil', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut_oil'), 'en', NULL, 'EXACT', 'FDA'),
('groundnut oil', 'groundnut oil', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut_oil'), 'en', 'IN', 'REGIONAL', 'MANUAL'),
('arachis oil', 'arachis oil', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'peanut_oil'), 'en', NULL, 'SCIENTIFIC', 'FDA');

-- Milk synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('milk', 'milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('whole milk', 'whole milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('skim milk', 'skim milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('skimmed milk', 'skimmed milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', 'GB', 'SPELLING', 'MANUAL'),
('cow milk', 'cow milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('cows milk', 'cows milk', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('dairy', 'dairy', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'en', NULL, 'EXACT', 'FDA'),
('lait', 'lait', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'fr', NULL, 'TRANSLATION', 'MANUAL'),
('milch', 'milch', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'de', NULL, 'TRANSLATION', 'MANUAL'),
('leche', 'leche', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'es', NULL, 'TRANSLATION', 'MANUAL'),
('doodh', 'doodh', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'milk'), 'hi', 'IN', 'TRANSLATION', 'MANUAL');

-- Whey synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('whey', 'whey', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey'), 'en', NULL, 'EXACT', 'FDA'),
('whey powder', 'whey powder', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey'), 'en', NULL, 'EXACT', 'FDA'),
('sweet whey', 'sweet whey', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey'), 'en', NULL, 'EXACT', 'FDA'),
('acid whey', 'acid whey', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey'), 'en', NULL, 'EXACT', 'FDA');

-- Whey protein concentrate synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('whey protein concentrate', 'whey protein concentrate', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'), 'en', NULL, 'EXACT', 'FDA'),
('wpc', 'wpc', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'), 'en', NULL, 'ABBREVIATION', 'MANUAL'),
('whey protein', 'whey protein', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'), 'en', NULL, 'EXACT', 'FDA'),
('whey protein isolate', 'whey protein isolate', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'), 'en', NULL, 'EXACT', 'FDA'),
('wpi', 'wpi', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'), 'en', NULL, 'ABBREVIATION', 'MANUAL');

-- Casein synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('casein', 'casein', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'casein'), 'en', NULL, 'EXACT', 'FDA'),
('caseinate', 'caseinate', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'casein'), 'en', NULL, 'EXACT', 'FDA'),
('sodium caseinate', 'sodium caseinate', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'casein'), 'en', NULL, 'EXACT', 'FDA'),
('calcium caseinate', 'calcium caseinate', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'casein'), 'en', NULL, 'EXACT', 'FDA'),
('milk protein', 'milk protein', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'casein'), 'en', NULL, 'EXACT', 'FDA');

-- Egg synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('egg', 'egg', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'en', NULL, 'EXACT', 'FDA'),
('eggs', 'eggs', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'en', NULL, 'EXACT', 'FDA'),
('whole egg', 'whole egg', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'en', NULL, 'EXACT', 'FDA'),
('dried egg', 'dried egg', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'en', NULL, 'EXACT', 'FDA'),
('egg powder', 'egg powder', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'en', NULL, 'EXACT', 'FDA'),
('oeuf', 'oeuf', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'fr', NULL, 'TRANSLATION', 'MANUAL'),
('huevo', 'huevo', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'es', NULL, 'TRANSLATION', 'MANUAL'),
('anda', 'anda', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'egg'), 'hi', 'IN', 'TRANSLATION', 'MANUAL');

-- Albumin synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('albumin', 'albumin', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'albumin'), 'en', NULL, 'EXACT', 'FDA'),
('albumen', 'albumen', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'albumin'), 'en', NULL, 'SPELLING', 'FDA'),
('egg albumin', 'egg albumin', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'albumin'), 'en', NULL, 'EXACT', 'FDA'),
('ovalbumin', 'ovalbumin', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'albumin'), 'en', NULL, 'SCIENTIFIC', 'FDA');

-- Soy synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('soy', 'soy', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'en', NULL, 'EXACT', 'FDA'),
('soya', 'soya', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'en', 'GB', 'SPELLING', 'MANUAL'),
('soybean', 'soybean', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'en', NULL, 'EXACT', 'FDA'),
('soybeans', 'soybeans', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'en', NULL, 'EXACT', 'FDA'),
('soya bean', 'soya bean', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'en', 'GB', 'SPELLING', 'MANUAL'),
('soja', 'soja', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy'), 'de', NULL, 'TRANSLATION', 'MANUAL');

-- Soy lecithin synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('soy lecithin', 'soy lecithin', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy_lecithin'), 'en', NULL, 'EXACT', 'FDA'),
('soya lecithin', 'soya lecithin', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy_lecithin'), 'en', 'GB', 'SPELLING', 'MANUAL'),
('lecithin (soy)', 'lecithin soy', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy_lecithin'), 'en', NULL, 'EXACT', 'FDA'),
('lecithin (soya)', 'lecithin soya', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy_lecithin'), 'en', 'GB', 'SPELLING', 'MANUAL'),
('e322 (soy)', 'e322 soy', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'soy_lecithin'), 'en', 'EU', 'ABBREVIATION', 'MANUAL');

-- Wheat synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('wheat', 'wheat', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'en', NULL, 'EXACT', 'FDA'),
('whole wheat', 'whole wheat', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'en', NULL, 'EXACT', 'FDA'),
('durum wheat', 'durum wheat', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'en', NULL, 'EXACT', 'FDA'),
('triticum', 'triticum', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'la', NULL, 'SCIENTIFIC', 'FDA'),
('ble', 'ble', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'fr', NULL, 'TRANSLATION', 'MANUAL'),
('weizen', 'weizen', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'de', NULL, 'TRANSLATION', 'MANUAL'),
('trigo', 'trigo', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'es', NULL, 'TRANSLATION', 'MANUAL'),
('gehun', 'gehun', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('atta', 'atta', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat_flour'), 'hi', 'IN', 'REGIONAL', 'MANUAL'),
('maida', 'maida', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'wheat_flour'), 'hi', 'IN', 'REGIONAL', 'MANUAL');

-- Gluten synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('gluten', 'gluten', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'gluten'), 'en', NULL, 'EXACT', 'FDA'),
('wheat gluten', 'wheat gluten', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'gluten'), 'en', NULL, 'EXACT', 'FDA'),
('vital wheat gluten', 'vital wheat gluten', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'gluten'), 'en', NULL, 'EXACT', 'FDA'),
('seitan', 'seitan', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'gluten'), 'en', NULL, 'REGIONAL', 'MANUAL');

-- Tree nut synonyms
INSERT INTO ingredient_synonyms (synonym, synonym_normalized, canonical_id, language_code, region_code, synonym_type, source) VALUES
('almond', 'almond', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'almond'), 'en', NULL, 'EXACT', 'FDA'),
('almonds', 'almonds', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'almond'), 'en', NULL, 'EXACT', 'FDA'),
('badam', 'badam', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'almond'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('cashew', 'cashew', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'cashew'), 'en', NULL, 'EXACT', 'FDA'),
('cashews', 'cashews', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'cashew'), 'en', NULL, 'EXACT', 'FDA'),
('kaju', 'kaju', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'cashew'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('walnut', 'walnut', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'walnut'), 'en', NULL, 'EXACT', 'FDA'),
('walnuts', 'walnuts', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'walnut'), 'en', NULL, 'EXACT', 'FDA'),
('akhrot', 'akhrot', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'walnut'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('pistachio', 'pistachio', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'pistachio'), 'en', NULL, 'EXACT', 'FDA'),
('pistachios', 'pistachios', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'pistachio'), 'en', NULL, 'EXACT', 'FDA'),
('pista', 'pista', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'pistachio'), 'hi', 'IN', 'TRANSLATION', 'MANUAL'),
('hazelnut', 'hazelnut', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'hazelnut'), 'en', NULL, 'EXACT', 'FDA'),
('hazelnuts', 'hazelnuts', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'hazelnut'), 'en', NULL, 'EXACT', 'FDA'),
('filbert', 'filbert', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'hazelnut'), 'en', NULL, 'REGIONAL', 'MANUAL'),
('filberts', 'filberts', (SELECT id FROM canonical_ingredients WHERE canonical_name = 'hazelnut'), 'en', NULL, 'REGIONAL', 'MANUAL');

-- ============================================================================
-- SEED DATA: RISK PHRASES
-- ============================================================================

INSERT INTO risk_phrases (phrase, phrase_normalized, risk_type, specific_allergen_id, output_risk_level, confidence) VALUES
-- Generic cross-contamination
('may contain', 'may contain', 'CROSS_CONTAMINATION', NULL, 'POSSIBLE', 0.90),
('may contain traces', 'may contain traces', 'CROSS_CONTAMINATION', NULL, 'TRACE', 0.85),
('may contain traces of', 'may contain traces of', 'CROSS_CONTAMINATION', NULL, 'TRACE', 0.85),

-- Facility warnings
('produced in a facility', 'produced in a facility', 'SHARED_FACILITY', NULL, 'POSSIBLE', 0.80),
('manufactured in a facility', 'manufactured in a facility', 'SHARED_FACILITY', NULL, 'POSSIBLE', 0.80),
('made in a facility', 'made in a facility', 'SHARED_FACILITY', NULL, 'POSSIBLE', 0.80),
('processed in a facility', 'processed in a facility', 'SHARED_FACILITY', NULL, 'POSSIBLE', 0.80),
('packaged in a facility', 'packaged in a facility', 'SHARED_FACILITY', NULL, 'POSSIBLE', 0.75),

-- Equipment warnings
('made on shared equipment', 'made on shared equipment', 'SHARED_EQUIPMENT', NULL, 'POSSIBLE', 0.85),
('made on equipment', 'made on equipment', 'SHARED_EQUIPMENT', NULL, 'POSSIBLE', 0.80),
('produced on equipment', 'produced on equipment', 'SHARED_EQUIPMENT', NULL, 'POSSIBLE', 0.80),

-- Not suitable warnings (specific)
('not suitable for nut allergy', 'not suitable for nut allergy', 'NOT_SUITABLE', (SELECT id FROM allergen_categories WHERE code = 'TREE_NUTS'), 'DEFINITE', 0.95),
('not suitable for peanut allergy', 'not suitable for peanut allergy', 'NOT_SUITABLE', (SELECT id FROM allergen_categories WHERE code = 'PEANUT'), 'DEFINITE', 0.95),
('not suitable for milk allergy', 'not suitable for milk allergy', 'NOT_SUITABLE', (SELECT id FROM allergen_categories WHERE code = 'MILK'), 'DEFINITE', 0.95),
('not suitable for egg allergy', 'not suitable for egg allergy', 'NOT_SUITABLE', (SELECT id FROM allergen_categories WHERE code = 'EGG'), 'DEFINITE', 0.95),

-- Contains warnings
('contains nuts', 'contains nuts', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'TREE_NUTS'), 'DEFINITE', 0.98),
('contains peanuts', 'contains peanuts', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'PEANUT'), 'DEFINITE', 0.98),
('contains milk', 'contains milk', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'MILK'), 'DEFINITE', 0.98),
('contains egg', 'contains egg', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'EGG'), 'DEFINITE', 0.98),
('contains soy', 'contains soy', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'SOY'), 'DEFINITE', 0.98),
('contains wheat', 'contains wheat', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'WHEAT'), 'DEFINITE', 0.98),
('contains gluten', 'contains gluten', 'CONTAINS_WARNING', (SELECT id FROM allergen_categories WHERE code = 'GLUTEN'), 'DEFINITE', 0.98);

-- ============================================================================
-- COMPOUND INGREDIENT MAPPINGS
-- ============================================================================

-- Whey protein concentrate contains whey (which maps to milk)
INSERT INTO compound_ingredients (compound_id, contains_id, is_required) VALUES
((SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey_protein_concentrate'),
 (SELECT id FROM canonical_ingredients WHERE canonical_name = 'whey'), TRUE);

-- ============================================================================
-- TRIGGERS FOR AUDIT
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_allergen_categories_modtime
    BEFORE UPDATE ON allergen_categories
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_canonical_ingredients_modtime
    BEFORE UPDATE ON canonical_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_ingredient_synonyms_modtime
    BEFORE UPDATE ON ingredient_synonyms
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
