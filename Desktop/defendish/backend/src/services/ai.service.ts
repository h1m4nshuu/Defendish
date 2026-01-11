import { matchAllergens } from './ingredient.service';
import Tesseract from 'tesseract.js';
import { ImagePreprocessor } from '../utils/imagePreprocessing';

interface AIRecommendation {
  decision: 'safe' | 'caution' | 'avoid';
  confidence: number;
  reason: string;
  matchedAllergens: string[];
  warnings: string[];
  explanation: string;
}

interface DateExtractionResult {
  manufacturingDate: string | null;
  expiryDate: string | null;
  confidence: {
    manufacturingDate: 'high' | 'medium' | 'low';
    expiryDate: 'high' | 'medium' | 'low';
  };
  rawText: string;
  qualityIssues: string[];
  bestBeforeInfo?: string | null;
  calculatedExpiry?: boolean;
  notes?: string[];
  warnings?: string[];
}

/**
 * Analyzes product packaging image to extract manufacturing and expiry dates
 * 
 * Uses enhanced preprocessing to create multiple optimized versions of the image
 * for better OCR accuracy. Runs OCR on all versions and merges results.
 * 
 * Core Principle:
 * Accuracy and uncertainty handling are more important than completeness.
 * 
 * Design Philosophy:
 * - Human-in-the-loop: All values shown to user for confirmation
 * - Accuracy over completeness: Better to return null than incorrect data
 * - Transparency: Clearly mark uncertainty and calculated values
 * - DO NOT guess - if text is unclear, mark as null and explain
 * - DO NOT infer without evidence
 */
export const extractDatesFromImage = async (
  imagePath: string
): Promise<DateExtractionResult> => {
  const preprocessor = new ImagePreprocessor();
  let processedImages: string[] = [];

  const result: DateExtractionResult = {
    manufacturingDate: null,
    expiryDate: null,
    confidence: {
      manufacturingDate: 'low',
      expiryDate: 'low'
    },
    rawText: '',
    qualityIssues: [],
    bestBeforeInfo: null,
    calculatedExpiry: false,
    notes: [],
    warnings: [],
  };

  try {
    console.log('🔍 Starting enhanced OCR processing...');
    
    // STEP 1: Analyze image quality
    console.log('📊 Step 1: Analyzing image quality...');
    const quality = await preprocessor.analyzeQuality(imagePath);
    
    console.log(`   Dimensions: ${quality.width}x${quality.height}`);
    console.log(`   Avg Brightness: ${quality.avgBrightness}/255`);
    console.log(`   Quality: ${quality.isBlurry ? '⚠️ Blurry' : '✅ Sharp'}`);
    
    // Store quality issues
    if (quality.isTooDark) {
      result.qualityIssues.push('Image is too dark - may affect OCR accuracy');
    }
    if (quality.isTooLight) {
      result.qualityIssues.push('Image is too light - may affect OCR accuracy');
    }
    if (quality.isBlurry) {
      result.qualityIssues.push('Image appears blurry - may affect text recognition');
    }
    if (quality.width < 800 || quality.height < 600) {
      result.qualityIssues.push('Image resolution is low - recommend higher resolution');
    }

    // STEP 2: Preprocess image
    console.log('🎨 Step 2: Preprocessing image (creating 3 versions)...');
    processedImages = await preprocessor.preprocess(imagePath);
    console.log(`   Created ${processedImages.length} preprocessed versions`);

    // STEP 3: Run OCR on all versions
    console.log('📖 Step 3: Running OCR on all versions...');
    const ocrTexts: string[] = [];
    
    for (let i = 0; i < processedImages.length; i++) {
      try {
        console.log(`   Processing version ${i + 1}/${processedImages.length}...`);
        const { data } = await Tesseract.recognize(processedImages[i], 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`   OCR Progress [v${i + 1}]: ${Math.round(m.progress * 100)}%`);
            }
          },
        });
        
        if (data.text && data.text.trim().length > 0) {
          ocrTexts.push(data.text);
          console.log(`   ✅ Version ${i + 1}: Extracted ${data.text.length} characters`);
        } else {
          console.log(`   ⚠️ Version ${i + 1}: No text extracted`);
        }
      } catch (error) {
        console.error(`   ❌ Version ${i + 1}: OCR failed:`, error instanceof Error ? error.message : error);
        // Continue with other versions
      }
    }

    // STEP 4: Merge results
    console.log('🔗 Step 4: Merging OCR results...');
    if (ocrTexts.length === 0) {
      result.qualityIssues.push('No text could be extracted from any version');
      result.warnings?.push('Image may be too blurry, dark, or low quality');
      console.log('   ❌ No text extracted from any version');
    } else {
      result.rawText = ocrTexts.join('\n---\n');
      console.log(`   ✅ Merged ${ocrTexts.length} OCR texts (${result.rawText.length} total characters)`);
      
      // Parse dates from merged text
      console.log('📅 Step 5: Extracting dates from text...');
      const parsed = extractDatesFromText(result.rawText);
      
      // Update result with parsed data
      result.manufacturingDate = parsed.mfgDate;
      result.expiryDate = parsed.expDate;
      result.confidence = {
        manufacturingDate: parsed.mfgConfidence,
        expiryDate: parsed.expConfidence
      };
      
      // Add notes
      if (result.manufacturingDate && result.expiryDate) {
        result.notes?.push('✅ Both manufacturing and expiry dates found');
      } else if (result.manufacturingDate || result.expiryDate) {
        result.notes?.push('⚠️ Only one date found - please verify manually');
      } else {
        result.qualityIssues.push('No dates detected in extracted text');
        result.notes?.push(`Extracted text sample: ${result.rawText.substring(0, 100)}...`);
      }
    }

    // Always remind user to verify
    result.warnings?.push('⚠️ Please manually verify all dates from the product packaging');

    console.log('✅ OCR processing complete');
    console.log(`   MFG: ${result.manufacturingDate || 'not found'} (${result.confidence.manufacturingDate})`);
    console.log(`   EXP: ${result.expiryDate || 'not found'} (${result.confidence.expiryDate})`);

    return result;

  } catch (error: any) {
    console.error('❌ OCR Error:', error.message);
    result.qualityIssues.push(`OCR processing failed: ${error.message}`);
    result.warnings?.push('An error occurred during text extraction');
    return result;
  } finally {
    // STEP 6: Cleanup (always execute)
    if (processedImages.length > 0) {
      console.log('🧹 Step 6: Cleaning up preprocessed images...');
      await preprocessor.cleanup(processedImages);
    }
  }
};

/**
 * Validates if a date string represents a valid date within reasonable range
 * 
 * @param dateStr - Date string to validate
 * @returns true if valid date between 2020-2030, false otherwise
 * 
 * @export For testing purposes
 */
export const isValidDate = (dateStr: string): boolean => {
  try {
    // Parse different date formats
    let year: number;
    let month: number;
    let day: number;

    // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyyMatch) {
      day = parseInt(ddmmyyyyMatch[1], 10);
      month = parseInt(ddmmyyyyMatch[2], 10) - 1; // JS months are 0-indexed
      year = parseInt(ddmmyyyyMatch[3], 10);
    }
    // Try YYYY-MM-DD (ISO format)
    else if (dateStr.match(/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/)) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return false;
      }
      year = date.getFullYear();
      month = date.getMonth();
      day = date.getDate();
    }
    // Try DDMMYYYY (compact)
    else if (dateStr.match(/^\d{8}$/)) {
      day = parseInt(dateStr.substring(0, 2), 10);
      month = parseInt(dateStr.substring(2, 4), 10) - 1;
      year = parseInt(dateStr.substring(4, 8), 10);
    }
    else {
      // Try generic parsing as last resort
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return false;
      }
      year = date.getFullYear();
      month = date.getMonth();
      day = date.getDate();
    }

    // Create date object to validate
    const date = new Date(year, month, day);
    
    // Check if date is valid (handles invalid days like 32/01/2025)
    if (isNaN(date.getTime()) || 
        date.getFullYear() !== year || 
        date.getMonth() !== month || 
        date.getDate() !== day) {
      return false;
    }
    
    // Check year is in reasonable range for food products (2020-2030)
    if (year < 2020 || year > 2030) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Extracts manufacturing and expiry dates from OCR text using comprehensive pattern matching
 * 
 * @param text - OCR extracted text
 * @returns Object with extracted dates and confidence levels
 * 
 * @export For testing purposes
 */
export const extractDatesFromText = (text: string): {
  mfgDate: string | null;
  expDate: string | null;
  mfgConfidence: 'high' | 'medium' | 'low';
  expConfidence: 'high' | 'medium' | 'low';
} => {
  const result = {
    mfgDate: null as string | null,
    expDate: null as string | null,
    mfgConfidence: 'low' as 'high' | 'medium' | 'low',
    expConfidence: 'low' as 'high' | 'medium' | 'low',
  };

  console.log('📝 Extracting dates from text...');

  // Date patterns (regex)
  const datePatterns = {
    // DD/MM/YYYY or MM/DD/YYYY
    slashDate: /\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/g,
    // YYYY-MM-DD
    isoDate: /\b(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})\b/g,
    // DDMMYYYY
    compactDate: /\b(\d{2})(\d{2})(\d{4})\b/g,
    // DD MON YYYY
    monthNameDate: /\b(\d{2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})\b/gi,
  };

  // Manufacturing Date Keywords with patterns (supports DD/MM/YYYY and YYYY-MM-DD)
  const mfgPatterns = [
    /MFG[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /MFG[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /MANUFACTURED[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /MANUFACTURED[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /MFD[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /MFD[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /PRODUCTION[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /PRODUCTION[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /PACKED[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /PACKED[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /PKD[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /PKD[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /MFG\s*DATE[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /MFG\s*DATE[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
  ];

  // Expiry Date Keywords with patterns (supports DD/MM/YYYY and YYYY-MM-DD)
  const expPatterns = [
    /EXP[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /EXP[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /EXPIRY[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /EXPIRY[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /EXPIRES[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /EXPIRES[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /BEST\s*BEFORE[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /BEST\s*BEFORE[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /USE\s*BY[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /USE\s*BY[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /VALID\s*UNTIL[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /VALID\s*UNTIL[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /USE\s*BEFORE[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /USE\s*BEFORE[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
    /EXP\s*DATE[\s:]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/gi,
    /EXP\s*DATE[\s:]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/gi, // ISO format
  ];

  // STEP A: Try to find dates WITH keywords (HIGH confidence)
  console.log('🔍 Step A: Looking for dates with MFG keywords...');
  for (const pattern of mfgPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1]) {
      const dateStr = match[1];
      if (isValidDate(dateStr)) {
        result.mfgDate = dateStr;
        result.mfgConfidence = 'high';
        console.log(`   ✅ Found MFG date with keyword: ${dateStr} (HIGH confidence)`);
        break;
      }
    }
  }

  console.log('🔍 Step A: Looking for dates with EXP keywords...');
  for (const pattern of expPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1]) {
      const dateStr = match[1];
      if (isValidDate(dateStr)) {
        result.expDate = dateStr;
        result.expConfidence = 'high';
        console.log(`   ✅ Found EXP date with keyword: ${dateStr} (HIGH confidence)`);
        break;
      }
    }
  }

  // STEP B: If dates not found with keywords, extract all dates (MEDIUM/LOW confidence)
  if (!result.mfgDate || !result.expDate) {
    console.log('🔍 Step B: Extracting all dates without keywords...');
    const allDates: string[] = [];

    // Extract all dates matching patterns
    for (const [patternName, pattern] of Object.entries(datePatterns)) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0];
        if (isValidDate(dateStr) && !allDates.includes(dateStr)) {
          allDates.push(dateStr);
          console.log(`   📅 Found date (${patternName}): ${dateStr}`);
        }
      }
    }

    if (allDates.length > 0) {
      console.log(`   Found ${allDates.length} total dates`);

      // Sort dates chronologically
      const sortedDates = allDates.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });

      if (allDates.length === 1) {
        // Only 1 date found - assume it's expiry (more commonly printed)
        if (!result.expDate) {
          result.expDate = sortedDates[0];
          result.expConfidence = 'medium';
          console.log(`   ⚠️ Single date found, assuming EXP: ${sortedDates[0]} (MEDIUM confidence)`);
        }
      } else if (allDates.length >= 2) {
        // Multiple dates - heuristic: earliest = MFG, latest = EXP
        if (!result.mfgDate) {
          result.mfgDate = sortedDates[0];
          result.mfgConfidence = 'medium';
          console.log(`   ⚠️ Earliest date as MFG: ${sortedDates[0]} (MEDIUM confidence)`);
        }
        if (!result.expDate) {
          result.expDate = sortedDates[sortedDates.length - 1];
          result.expConfidence = 'medium';
          console.log(`   ⚠️ Latest date as EXP: ${sortedDates[sortedDates.length - 1]} (MEDIUM confidence)`);
        }
      }
    } else {
      console.log('   ❌ No valid dates found');
    }
  }

  // STEP C: Validate date logic
  if (result.mfgDate && result.expDate) {
    const mfgTime = new Date(result.mfgDate).getTime();
    const expTime = new Date(result.expDate).getTime();
    
    if (mfgTime > expTime) {
      console.log('   ⚠️ Warning: MFG date is after EXP date - may be incorrect');
      // Lower confidence if dates don't make logical sense
      if (result.mfgConfidence === 'high') result.mfgConfidence = 'medium';
      if (result.expConfidence === 'high') result.expConfidence = 'medium';
    }
  }

  console.log('📊 Date extraction complete:');
  console.log(`   MFG: ${result.mfgDate || 'not found'} (${result.mfgConfidence})`);
  console.log(`   EXP: ${result.expDate || 'not found'} (${result.expConfidence})`);

  return result;
};

/**
 * Parses extracted text to find manufacturing and expiry dates
 * 
 * @deprecated Use extractDatesFromText instead
 * 
 * This function is kept for backward compatibility but the new
 * extractDatesFromText function provides better pattern matching
 */
// @ts-ignore: Unused but kept for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseDatesFromText = (text: string): Partial<DateExtractionResult> => {
  const result: Partial<DateExtractionResult> = {
    manufacturingDate: null,
    expiryDate: null,
    bestBeforeInfo: null,
    calculatedExpiry: false,
    notes: [],
    warnings: [],
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('🔍 Parsing', lines.length, 'lines of text');
  
  // Date regex patterns - More flexible
  const datePatterns = {
    ddmmyyyy: /\b(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{4})\b/g,
    ddmmyy: /\b(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2})\b/g,
    mmyyyy: /\b(\d{1,2})[\/\-\.\s](\d{4})\b/g,
    mmmyyyy: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\.]+(\d{4})\b/gi,
    yyyymmdd: /\b(20\d{2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,2})\b/g,
  };

  // Manufacturing keywords - comprehensive list
  const mfgKeywords = [
    'MFG', 'MFD', 'MFGD', 'MANUFACTURED', 'MANUFACTURED ON', 'MFG DATE',
    'PACKED', 'PACKED ON', 'PKD', 'PACKING DATE', 'PKG DATE', 'PKG',
    'DATE OF MFG', 'DATE OF MANUFACTURE', 'MANUFACTURING DATE',
    'PRODUCTION DATE', 'PROD DATE', 'MADE ON', 'MADE'
  ];
  
  // Expiry keywords - comprehensive list
  const expKeywords = [
    'EXP', 'EXPIRY', 'EXPIRES', 'EXPIRES ON', 'EXPIRY DATE', 'EXP DATE',
    'USE BEFORE', 'USE BY', 'BEST BEFORE', 'BB', 'BEST BY',
    'SHELF LIFE', 'VALID UNTIL', 'CONSUME BEFORE', 'USE WITHIN',
    'DATE OF EXPIRY', 'EXPIRATION', 'GOOD UNTIL'
  ];
  
  // Best before pattern with shelf life
  const bestBeforePattern = /best\s+before\s+(\d+)\s+(months?|years?)\s+(?:from|of)\s+(mfg|mfd|pkg|pkd|packed|manufacture|manufacturing)/gi;
  const shelfLifePattern = /shelf\s+life[:\s]+(\d+)\s+(months?|years?)/gi;

  // Dates to ignore (batch, license, FSSAI)
  const ignoredContextKeywords = [
    'BATCH', 'LOT', 'LICENSE', 'LIC', 'FSSAI',
    'REG', 'REGISTRATION', 'CODE', 'BARCODE', 'BATCH NO'
  ];

  let detectedDates: { date: string; context: string; lineText: string; keyword: string }[] = [];

  // First pass - look for dates with clear context
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    console.log('📝 Checking line:', line);
    
    // Skip lines with ignored context
    if (ignoredContextKeywords.some(keyword => upperLine.includes(keyword))) {
      console.log('⏭️ Skipping (ignored context)');
      continue;
    }

    // Check for manufacturing date
    for (const keyword of mfgKeywords) {
      if (upperLine.includes(keyword)) {
        console.log('🏭 Found MFG keyword:', keyword);
        
        // Try all date patterns
        for (const [patternName, pattern] of Object.entries(datePatterns)) {
          pattern.lastIndex = 0; // Reset regex
          const matches = [...line.matchAll(pattern)];
          
          if (matches.length > 0) {
            for (const match of matches) {
              const extractedDate = match[0];
              console.log(`📅 Found date with pattern ${patternName}:`, extractedDate);
              
              const validation = validateAndFormatDate(extractedDate, 'manufacturing');
              
              if (validation.valid && !result.manufacturingDate) {
                result.manufacturingDate = validation.formatted;
                result.notes?.push(`✅ Manufacturing date: ${extractedDate} (keyword: ${keyword}, confidence: ${validation.confidence})`);
                detectedDates.push({ date: extractedDate, context: 'manufacturing', lineText: line, keyword });
                break;
              }
            }
          }
        }
      }
    }

    // Check for expiry date
    for (const keyword of expKeywords) {
      if (upperLine.includes(keyword)) {
        console.log('⏰ Found EXP keyword:', keyword);
        
        // Try all date patterns
        for (const [patternName, pattern] of Object.entries(datePatterns)) {
          pattern.lastIndex = 0; // Reset regex
          const matches = [...line.matchAll(pattern)];
          
          if (matches.length > 0) {
            for (const match of matches) {
              const extractedDate = match[0];
              console.log(`📅 Found date with pattern ${patternName}:`, extractedDate);
              
              const validation = validateAndFormatDate(extractedDate, 'expiry');
              
              if (validation.valid && !result.expiryDate) {
                result.expiryDate = validation.formatted;
                result.notes?.push(`✅ Expiry date: ${extractedDate} (keyword: ${keyword}, confidence: ${validation.confidence})`);
                detectedDates.push({ date: extractedDate, context: 'expiry', lineText: line, keyword });
                break;
              }
            }
          }
        }
      }
    }

    // Check for "best before X months from MFG" pattern
    bestBeforePattern.lastIndex = 0;
    const bbMatch = line.match(bestBeforePattern);
    if (bbMatch) {
      const duration = parseInt(bbMatch[1]);
      const unit = bbMatch[2].toLowerCase();
      result.bestBeforeInfo = bbMatch[0];
      result.notes?.push(`📋 Best before: ${bbMatch[0]}`);
      
      if (result.manufacturingDate) {
        const calculatedDate = calculateExpiryDate(result.manufacturingDate, duration, unit);
        if (calculatedDate && !result.expiryDate) {
          result.expiryDate = calculatedDate;
          result.calculatedExpiry = true;
          result.notes?.push(`🔢 Calculated expiry: ${calculatedDate} (source: MFG + ${duration} ${unit})`);
          result.warnings?.push('⚠️ Expiry date is CALCULATED - verify manually');
        }
      }
    }

    // Check for shelf life pattern
    shelfLifePattern.lastIndex = 0;
    const shelfMatch = line.match(shelfLifePattern);
    if (shelfMatch && !result.bestBeforeInfo) {
      result.bestBeforeInfo = shelfMatch[0];
      result.notes?.push(`📋 Shelf life: ${shelfMatch[0]}`);
    }
  }

  // Second pass - if no dates found with keywords, try standalone dates
  if (!result.manufacturingDate && !result.expiryDate) {
    console.log('🔍 No dates found with keywords, trying standalone dates...');
    
    for (const line of lines) {
      if (ignoredContextKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        continue;
      }
      
      for (const [_patternName, pattern] of Object.entries(datePatterns)) {
        pattern.lastIndex = 0;
        const matches = [...line.matchAll(pattern)];
        
        for (const match of matches) {
          const extractedDate = match[0];
          const validation = validateAndFormatDate(extractedDate, 'manufacturing');
          
          if (validation.valid) {
            if (!result.manufacturingDate) {
              result.manufacturingDate = validation.formatted;
              result.notes?.push(`⚠️ Date found without keyword: ${extractedDate} (assuming MFG)`);
              result.warnings?.push('Date found without clear context - please verify');
            } else if (!result.expiryDate) {
              result.expiryDate = validation.formatted;
              result.notes?.push(`⚠️ Date found without keyword: ${extractedDate} (assuming EXP)`);
              result.warnings?.push('Date found without clear context - please verify');
            }
          }
        }
      }
    }
  }

  // Multiple dates validation
  if (detectedDates.length > 2) {
    result.warnings?.push(`⚠️ Multiple dates detected (${detectedDates.length}) - classified by context`);
  }

  // Validation
  if (!result.manufacturingDate && !result.expiryDate) {
    result.warnings?.push('❌ No valid dates detected - format not recognized or dates not visible');
    result.notes?.push('Try capturing a clearer image with better lighting');
  }

  if (result.manufacturingDate && result.expiryDate) {
    const mfgValid = validateDateLogic(result.manufacturingDate, result.expiryDate);
    if (!mfgValid) {
      result.warnings?.push('⚠️ Warning: Expiry date appears before manufacturing date - please verify');
    }
  }

  return result;
};

/**
 * Validates date format and converts to standard format
 * Handles Indian date formats: DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, MMM YYYY
 * 
 * Returns null if date is unclear or ambiguous - DO NOT GUESS
 */
const validateAndFormatDate = (
  dateString: string,
  _context: 'manufacturing' | 'expiry'
): { valid: boolean; formatted: string | null; confidence: 'high' | 'medium' | 'low' } => {
  if (!dateString || dateString.trim().length === 0) {
    return { valid: false, formatted: null, confidence: 'low' };
  }

  const trimmed = dateString.trim();

  // Try to parse different formats
  const formats = [
    { 
      pattern: /^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/, 
      type: 'DD/MM/YYYY',
      parse: (match: RegExpMatchArray) => {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        // Validate ranges
        if (day < 1 || day > 31 || month < 1 || month > 12) {
          return null;
        }
        
        // Year validation - reasonable range
        const currentYear = new Date().getFullYear();
        if (year < 2000 || year > currentYear + 10) {
          return null;
        }
        
        return `${match[1]}/${match[2]}/${match[3]}`;
      }
    },
    { 
      pattern: /^(\d{2})[\/\-\.](\d{4})$/, 
      type: 'MM/YYYY',
      parse: (match: RegExpMatchArray) => {
        const month = parseInt(match[1]);
        const year = parseInt(match[2]);
        
        if (month < 1 || month > 12) {
          return null;
        }
        
        const currentYear = new Date().getFullYear();
        if (year < 2000 || year > currentYear + 10) {
          return null;
        }
        
        return `${match[1]}/${match[2]}`;
      }
    },
    {
      pattern: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\.]+(\d{4})$/i,
      type: 'MMM YYYY',
      parse: (match: RegExpMatchArray) => {
        const monthMap: Record<string, string> = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        const monthStr = match[1].toLowerCase().substring(0, 3);
        const year = parseInt(match[2]);
        const month = monthMap[monthStr];
        
        const currentYear = new Date().getFullYear();
        if (year < 2000 || year > currentYear + 10) {
          return null;
        }
        
        return `${month}/${match[2]}`;
      }
    }
  ];

  for (const format of formats) {
    const match = trimmed.match(format.pattern);
    if (match) {
      const parsed = format.parse(match);
      if (parsed) {
        return {
          valid: true,
          formatted: parsed,
          confidence: 'high',
        };
      }
    }
  }

  // If no format matched, return null - DO NOT GUESS
  return {
    valid: false,
    formatted: null,
    confidence: 'low',
  };
};

/**
 * Calculates expiry date from manufacturing date and duration
 * Used for "Best before X months from MFG" scenarios
 */
const calculateExpiryDate = (
  mfgDate: string,
  duration: number,
  unit: string
): string | null => {
  try {
    // Parse DD/MM/YYYY format
    const ddmmyyyyMatch = mfgDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1]);
      const month = parseInt(ddmmyyyyMatch[2]);
      const year = parseInt(ddmmyyyyMatch[3]);
      
      const date = new Date(year, month - 1, day);
      
      if (unit.toLowerCase().startsWith('month')) {
        date.setMonth(date.getMonth() + duration);
      } else if (unit.toLowerCase().startsWith('year')) {
        date.setFullYear(date.getFullYear() + duration);
      }
      
      const expDay = String(date.getDate()).padStart(2, '0');
      const expMonth = String(date.getMonth() + 1).padStart(2, '0');
      const expYear = date.getFullYear();
      
      return `${expDay}/${expMonth}/${expYear}`;
    }
    
    // Parse MM/YYYY format
    const mmyyyyMatch = mfgDate.match(/^(\d{2})\/(\d{4})$/);
    if (mmyyyyMatch) {
      const month = parseInt(mmyyyyMatch[1]);
      const year = parseInt(mmyyyyMatch[2]);
      
      const date = new Date(year, month - 1, 1);
      
      if (unit.toLowerCase().startsWith('month')) {
        date.setMonth(date.getMonth() + duration);
      } else if (unit.toLowerCase().startsWith('year')) {
        date.setFullYear(date.getFullYear() + duration);
      }
      
      const expMonth = String(date.getMonth() + 1).padStart(2, '0');
      const expYear = date.getFullYear();
      
      return `${expMonth}/${expYear}`;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Validates that expiry date is after manufacturing date
 */
const validateDateLogic = (mfgDate: string, expDate: string): boolean => {
  try {
    // Parse DD/MM/YYYY format
    const parseMfg = mfgDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const parseExp = expDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    
    if (parseMfg && parseExp) {
      const mfgTime = new Date(
        parseInt(parseMfg[3]),
        parseInt(parseMfg[2]) - 1,
        parseInt(parseMfg[1])
      ).getTime();
      
      const expTime = new Date(
        parseInt(parseExp[3]),
        parseInt(parseExp[2]) - 1,
        parseInt(parseExp[1])
      ).getTime();
      
      return expTime > mfgTime;
    }
    
    // If we can't parse both, assume valid (benefit of doubt)
    return true;
  } catch (error) {
    return true;
  }
};

export const analyzeProductSuitability = async (
  ingredients: string[],
  profileAllergies: string[],
  userDecision: 'safe' | 'unsafe'
): Promise<AIRecommendation> => {
  // Rule-based AI analysis (MVP version)
  // In production, this would integrate with GPT or custom ML model

  const { matched: matchedAllergens } = matchAllergens(ingredients, profileAllergies);

  let decision: 'safe' | 'caution' | 'avoid' = 'safe';
  let confidence = 0.95;
  let reason = '';
  const warnings: string[] = [];
  let explanation = '';

  // Analysis logic
  if (matchedAllergens.length > 0) {
    decision = 'avoid';
    confidence = 0.98;
    reason = `Contains allergen(s): ${matchedAllergens.join(', ')}`;
    
    matchedAllergens.forEach((allergen) => {
      warnings.push(`⚠️ ALLERGEN DETECTED: ${allergen.toUpperCase()}`);
    });

    if (userDecision === 'safe') {
      warnings.push(
        '🚨 WARNING: You marked this as safe, but it contains your listed allergens. Please double-check!'
      );
      explanation = `
        Based on your allergy profile, this product contains ${matchedAllergens.join(', ')} 
        which you have listed as allergen(s). However, you marked it as safe for consumption.
        
        Please ensure:
        1. You have reviewed the ingredients carefully
        2. You have consulted with a medical professional if needed
        3. You understand the potential risks
        
        We strongly recommend avoiding this product unless you have medical clearance.
      `.trim();
    } else {
      explanation = `
        This product contains ${matchedAllergens.join(', ')} which match your allergy profile.
        We recommend avoiding this product to prevent allergic reactions.
        
        Your decision to mark it as unsafe aligns with our AI analysis.
      `.trim();
    }
  } else {
    if (userDecision === 'safe') {
      decision = 'safe';
      confidence = 0.90;
      reason = 'No known allergens detected in ingredients';
      explanation = `
        Based on your allergy profile (${profileAllergies.join(', ')}), 
        we did not detect any matching allergens in this product's ingredients.
        
        Your decision to mark it as safe aligns with our analysis.
        However, always read labels carefully as formulations may change.
      `.trim();
    } else {
      decision = 'caution';
      confidence = 0.75;
      reason = 'No allergens detected, but user marked as unsafe';
      warnings.push(
        '⚠️ You marked this as unsafe despite no detected allergens. Please verify your reason.'
      );
      explanation = `
        Our analysis did not detect any allergens matching your profile.
        However, you marked this product as unsafe.
        
        Possible reasons:
        1. Cross-contamination concerns
        2. Past negative experience with this product
        3. Other ingredients you want to avoid
        4. Dietary restrictions not listed in allergies
        
        Your personal experience and judgment are important. 
        This decision has been logged for future reference.
      `.trim();
    }
  }

  return {
    decision,
    confidence,
    reason,
    matchedAllergens,
    warnings,
    explanation,
  };
};
