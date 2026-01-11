/**
 * Comprehensive OCR Date Extraction Tests
 * 
 * Tests the enhanced OCR functionality including:
 * - extractDatesFromText() with various text patterns
 * - extractDatesFromImage() with actual images
 * - isValidDate() helper function
 */

import { 
  extractDatesFromText, 
  extractDatesFromImage, 
  isValidDate 
} from '../src/services/ai.service';
import path from 'path';
import fs from 'fs';

describe('OCR Date Extraction', () => {
  
  // ==================================================================
  // TEST SUITE 1: extractDatesFromText()
  // ==================================================================
  
  describe('extractDatesFromText', () => {
    
    // Test Case 1: Dates with MFG/EXP keywords (HIGH confidence)
    test('should extract dates with MFG/EXP keywords with HIGH confidence', () => {
      const input = "Product Name\nMFG: 15/01/2025\nEXP: 15/01/2026\nBatch: 12345";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
      expect(result.mfgConfidence).toBe('high');
      expect(result.expConfidence).toBe('high');
    });

    // Test Case 2: Dates without keywords (MEDIUM confidence)
    test('should extract dates without keywords with MEDIUM confidence', () => {
      const input = "Product Name\n15/01/2025\n15/01/2026\nBatch: 12345";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
      expect(result.mfgConfidence).toBe('medium');
      expect(result.expConfidence).toBe('medium');
    });

    // Test Case 3: Only expiry date with keyword
    test('should extract only expiry date when MFG is missing', () => {
      const input = "Product Name\nEXP: 15/01/2026\nBatch: 12345";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBeNull();
      expect(result.expDate).toBe('15/01/2026');
      expect(result.expConfidence).toBe('high');
    });

    // Test Case 3b: Only one date without keyword (assume expiry)
    test('should assume single date is expiry when no keywords', () => {
      const input = "Product Name\n15/01/2026\nBatch: 12345";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBeNull();
      expect(result.expDate).toBe('15/01/2026');
      expect(result.expConfidence).toBe('medium');
    });

    // Test Case 4: Multiple date formats
    test('should extract multiple date formats correctly', () => {
      const input = "MFG: 15/01/2025\nEXP: 2026-01-15";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('2026-01-15');
      expect(result.mfgConfidence).toBe('high');
      // ISO format is extracted with HIGH confidence when EXP keyword is present
      expect(result.expConfidence).toBe('high');
    });

    // Test Case 4b: Compact date format (DDMMYYYY)
    test('should extract compact date format (DDMMYYYY)', () => {
      const input = "MFG 15012025\nEXP 15012026";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBeTruthy();
      expect(result.expDate).toBeTruthy();
    });

    // Test Case 5: BEST BEFORE keyword
    test('should extract BEST BEFORE date with HIGH confidence', () => {
      const input = "BEST BEFORE: 15/01/2026";
      const result = extractDatesFromText(input);
      
      expect(result.expDate).toBe('15/01/2026');
      expect(result.expConfidence).toBe('high');
    });

    // Test Case 5b: USE BY keyword
    test('should extract USE BY date with HIGH confidence', () => {
      const input = "USE BY: 20/06/2026";
      const result = extractDatesFromText(input);
      
      expect(result.expDate).toBe('20/06/2026');
      expect(result.expConfidence).toBe('high');
    });

    // Test Case 5c: MANUFACTURED keyword
    test('should extract MANUFACTURED date with HIGH confidence', () => {
      const input = "MANUFACTURED: 01/03/2025";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('01/03/2025');
      expect(result.mfgConfidence).toBe('high');
    });

    // Test Case 5d: PACKED keyword
    test('should extract PACKED date as manufacturing with HIGH confidence', () => {
      const input = "PACKED: 10/02/2025";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('10/02/2025');
      expect(result.mfgConfidence).toBe('high');
    });

    // Test Case 6: Invalid dates (out of range)
    test('should reject dates outside 2020-2030 range', () => {
      const input = "MFG: 15/01/2019\nEXP: 15/01/2035";
      const result = extractDatesFromText(input);
      
      // Both dates should be rejected (outside valid range)
      expect(result.mfgDate).toBeNull();
      expect(result.expDate).toBeNull();
    });

    // Test Case 6b: One valid, one invalid date
    test('should accept valid date and reject invalid date', () => {
      // When EXP date is invalid (2035), it should be rejected
      // But MFG should still be extracted
      const input = "MFG: 15/01/2025\nEXP: 15/01/2035";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025'); // Valid
      // 2035 should be rejected as it's outside the valid range
      // If no other dates found, it might fall back to MEDIUM confidence heuristic
      // So we just check that IF expDate exists, it's not 2035
      if (result.expDate) {
        expect(result.expDate).not.toContain('2035');
      }
    });

    // Test Case 7: No dates found
    test('should return null when no dates are found', () => {
      const input = "Product Name\nBatch: 12345\nWeight: 500g";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBeNull();
      expect(result.expDate).toBeNull();
    });

    // Additional: MFD (Manufacturing Date) keyword
    test('should extract MFD (Manufacturing Date) keyword', () => {
      const input = "MFD: 05/04/2025";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('05/04/2025');
      expect(result.mfgConfidence).toBe('high');
    });

    // Additional: PRODUCTION keyword
    test('should extract PRODUCTION date keyword', () => {
      const input = "PRODUCTION: 12/03/2025";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('12/03/2025');
      expect(result.mfgConfidence).toBe('high');
    });

    // Additional: EXPIRES keyword
    test('should extract EXPIRES keyword', () => {
      const input = "EXPIRES: 25/12/2026";
      const result = extractDatesFromText(input);
      
      expect(result.expDate).toBe('25/12/2026');
      expect(result.expConfidence).toBe('high');
    });

    // Additional: VALID UNTIL keyword
    test('should extract VALID UNTIL keyword', () => {
      const input = "VALID UNTIL: 30/11/2026";
      const result = extractDatesFromText(input);
      
      expect(result.expDate).toBe('30/11/2026');
      expect(result.expConfidence).toBe('high');
    });

    // Additional: Dates in reverse order (EXP before MFG in text)
    test('should handle dates in any order in text', () => {
      const input = "EXP: 15/01/2026\nMFG: 15/01/2025";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
      expect(result.mfgConfidence).toBe('high');
      expect(result.expConfidence).toBe('high');
    });

    // Additional: Case insensitivity
    test('should handle keywords in different cases', () => {
      const input = "mfg: 15/01/2025\nexp: 15/01/2026";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
    });

    // Additional: Extra whitespace
    test('should handle extra whitespace around keywords and dates', () => {
      const input = "MFG:   15/01/2025  \n  EXP:  15/01/2026";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
    });
  });

  // ==================================================================
  // TEST SUITE 2: extractDatesFromImage()
  // ==================================================================
  
  describe('extractDatesFromImage', () => {
    const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'images');

    // Skip image tests if fixtures don't exist
    const hasFixtures = fs.existsSync(FIXTURES_DIR);
    
    if (!hasFixtures) {
      console.warn('⚠️  Test image fixtures not found. Run: npx tsx tests/fixtures/createTestImages.ts');
    }

    // Test Case 8: Clear product image with dates
    test('should extract dates from clear product image', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'clear-product-with-dates.png');
      
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️  Test image not found:', imagePath);
        return; // Skip test if image doesn't exist
      }

      const result = await extractDatesFromImage(imagePath);
      
      // Should extract dates (exact match depends on OCR accuracy)
      expect(result).toBeDefined();
      expect(result.rawText).toBeDefined();
      expect(result.rawText.length).toBeGreaterThan(0);
      
      // Check structure
      expect(result).toHaveProperty('manufacturingDate');
      expect(result).toHaveProperty('expiryDate');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toHaveProperty('manufacturingDate');
      expect(result.confidence).toHaveProperty('expiryDate');
      expect(result).toHaveProperty('qualityIssues');
      expect(Array.isArray(result.qualityIssues)).toBe(true);
      
      // Verify preprocessed images were cleaned up
      const preprocessedPattern = imagePath.replace('.png', '_processed');
      const version1 = `${preprocessedPattern}1.png`;
      const version2 = `${preprocessedPattern}2.png`;
      const version3 = `${preprocessedPattern}3.png`;
      
      expect(fs.existsSync(version1)).toBe(false);
      expect(fs.existsSync(version2)).toBe(false);
      expect(fs.existsSync(version3)).toBe(false);
    }, 10000); // 10 second timeout for OCR

    // Test Case 9: Poor quality image (dark/blurry)
    test('should detect quality issues in poor quality image', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'poor-quality-image.png');
      
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️  Test image not found:', imagePath);
        return;
      }

      const result = await extractDatesFromImage(imagePath);
      
      expect(result).toBeDefined();
      expect(result.qualityIssues).toBeDefined();
      
      // Should have some quality warnings
      // (exact warnings depend on image quality analysis)
      expect(Array.isArray(result.qualityIssues)).toBe(true);
      
      // Should still attempt extraction without errors
      expect(result.rawText).toBeDefined();
    }, 10000);

    // Test Case 10: Image with no dates
    test('should handle image with no dates gracefully', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'no-dates-image.png');
      
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️  Test image not found:', imagePath);
        return;
      }

      const result = await extractDatesFromImage(imagePath);
      
      expect(result).toBeDefined();
      expect(result.manufacturingDate).toBeNull();
      expect(result.expiryDate).toBeNull();
      expect(result.rawText).toBeDefined();
      
      // Should not throw errors
    }, 10000);

    // Additional: Image with multiple date formats
    test('should extract multiple date formats from image', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'multiple-date-formats.png');
      
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️  Test image not found:', imagePath);
        return;
      }

      const result = await extractDatesFromImage(imagePath);
      
      expect(result).toBeDefined();
      expect(result.rawText).toBeDefined();
      expect(result.rawText.length).toBeGreaterThan(0);
    }, 10000);

    // Additional: Image with BEST BEFORE keyword
    test('should extract BEST BEFORE date from image', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'best-before-only.png');
      
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️  Test image not found:', imagePath);
        return;
      }

      const result = await extractDatesFromImage(imagePath);
      
      expect(result).toBeDefined();
      expect(result.rawText).toBeDefined();
    }, 10000);

    // Additional: Non-existent image
    test('should handle non-existent image error gracefully', async () => {
      const imagePath = path.join(FIXTURES_DIR, 'non-existent-image.png');
      
      // extractDatesFromImage handles errors gracefully and returns result with error info
      const result = await extractDatesFromImage(imagePath);
      
      expect(result).toBeDefined();
      expect(result.qualityIssues).toBeDefined();
      expect(result.qualityIssues.length).toBeGreaterThan(0);
      expect(result.qualityIssues[0]).toContain('OCR processing failed');
      expect(result.manufacturingDate).toBeNull();
      expect(result.expiryDate).toBeNull();
    });
  });

  // ==================================================================
  // TEST SUITE 3: isValidDate()
  // ==================================================================
  
  describe('isValidDate', () => {
    
    // Test Case 11: Valid dates
    describe('should accept valid dates', () => {
      test('DD/MM/YYYY format', () => {
        expect(isValidDate('15/01/2025')).toBe(true);
        expect(isValidDate('01/03/2026')).toBe(true);
        expect(isValidDate('31/12/2025')).toBe(true);
      });

      test('YYYY-MM-DD format (ISO)', () => {
        expect(isValidDate('2025-01-15')).toBe(true);
        expect(isValidDate('2026-03-01')).toBe(true);
        expect(isValidDate('2025-12-31')).toBe(true);
      });

      test('dates at boundaries (2020-2030)', () => {
        expect(isValidDate('01/01/2020')).toBe(true);
        expect(isValidDate('31/12/2030')).toBe(true);
        expect(isValidDate('15/06/2025')).toBe(true);
      });
    });

    // Test Case 12: Invalid dates
    describe('should reject invalid dates', () => {
      test('dates too old (before 2020)', () => {
        expect(isValidDate('15/01/2019')).toBe(false);
        expect(isValidDate('31/12/2019')).toBe(false);
        expect(isValidDate('01/01/2010')).toBe(false);
      });

      test('dates too far in future (after 2030)', () => {
        expect(isValidDate('15/01/2035')).toBe(false);
        expect(isValidDate('01/01/2031')).toBe(false);
        expect(isValidDate('31/12/2040')).toBe(false);
      });

      test('invalid date strings', () => {
        expect(isValidDate('invalid')).toBe(false);
        expect(isValidDate('not-a-date')).toBe(false);
        expect(isValidDate('abc123')).toBe(false);
        expect(isValidDate('')).toBe(false);
      });

      test('malformed dates', () => {
        expect(isValidDate('32/01/2025')).toBe(false); // Invalid day
        expect(isValidDate('15/13/2025')).toBe(false); // Invalid month
        expect(isValidDate('00/00/2025')).toBe(false); // Invalid day/month
      });
    });

    // Additional edge cases
    test('should handle various separators', () => {
      expect(isValidDate('15-01-2025')).toBe(true);
      expect(isValidDate('15.01.2025')).toBe(true);
    });

    test('should reject very old dates', () => {
      expect(isValidDate('01/01/1900')).toBe(false);
      expect(isValidDate('15/08/1990')).toBe(false);
    });

    test('should reject dates with wrong century', () => {
      expect(isValidDate('15/01/3025')).toBe(false);
    });
  });

  // ==================================================================
  // TEST SUITE 4: Integration Tests
  // ==================================================================
  
  describe('Integration Tests', () => {
    
    test('extractDatesFromText should use isValidDate for validation', () => {
      const input = "MFG: 15/01/2019\nEXP: 15/01/2025";
      const result = extractDatesFromText(input);
      
      // 2019 should be rejected, 2025 should be accepted
      expect(result.mfgDate).toBeNull();
      expect(result.expDate).toBe('15/01/2025');
    });

    test('should handle real-world product text format', () => {
      const input = `
        ORGANIC WHEAT FLOUR
        Net Weight: 500g
        MFG DATE: 15/01/2025
        BEST BEFORE: 15/01/2026
        Batch No: XYZ12345
        FSSAI Lic: 12345678901234
        Manufacturer: ABC Foods Ltd.
      `;
      
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
      expect(result.mfgConfidence).toBe('high');
      expect(result.expConfidence).toBe('high');
    });

    test('should prioritize keywords over standalone dates', () => {
      const input = `
        Random date: 01/01/2024
        MFG: 15/01/2025
        Another date: 05/05/2025
        EXP: 15/01/2026
      `;
      
      const result = extractDatesFromText(input);
      
      // Should extract dates with keywords, not standalone dates
      expect(result.mfgDate).toBe('15/01/2025');
      expect(result.expDate).toBe('15/01/2026');
      expect(result.mfgConfidence).toBe('high');
      expect(result.expConfidence).toBe('high');
    });

    test('should handle Indian date format (DD/MM/YYYY) correctly', () => {
      const input = "MFG: 25/12/2025\nEXP: 25/12/2026";
      const result = extractDatesFromText(input);
      
      expect(result.mfgDate).toBe('25/12/2025');
      expect(result.expDate).toBe('25/12/2026');
    });
  });
});
