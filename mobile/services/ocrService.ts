/**
 * OCR Service for Mobile App
 * 
 * Handles communication between mobile app and OCR backend
 */

import axios, { AxiosError } from 'axios';
import * as FileSystem from 'expo-file-system';
import { CapturedFrame } from '../utils/frameCapture';
import { getApiBaseUrl } from './apiConfig';

// ==================================================================
// API CONFIGURATION
// ==================================================================

const API_BASE_URL = getApiBaseUrl();

console.log('OCR API URL:', API_BASE_URL);

const API_TIMEOUT = 60000; // 60 seconds for OCR processing
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// ==================================================================
// TYPES & INTERFACES
// ==================================================================

/**
 * OCR result from backend
 */
export interface OCRResult {
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
 * Product OCR scan request
 */
export interface OCRScanRequest {
  productName: string;
  frames: CapturedFrame[];
  profileId?: string;
}

/**
 * Product OCR scan response
 */
export interface OCRScanResponse {
  success: boolean;
  message: string;
  data?: {
    productId: string;
    ocrResults: {
      [angle: string]: OCRResult;
    };
    primaryDates: {
      manufacturingDate: string | null;
      expiryDate: string | null;
      confidence: string;
    };
  };
  error?: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * OCR processing status
 */
export interface OCRProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  currentFrame?: string;
  message?: string;
  error?: string;
}

/**
 * API Error response
 */
export interface APIError {
  message: string;
  statusCode: number;
  details?: string;
}

// ==================================================================
// AXIOS INSTANCE
// ==================================================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // TODO: Get token from AsyncStorage/SecureStore
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Error setting up request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ==================================================================
// CORE OCR FUNCTIONS
// ==================================================================

/**
 * Upload and process a single frame for OCR
 * 
 * @param frame - Captured frame to process
 * @param onProgress - Progress callback
 * @returns OCR result
 */
export async function processFrame(
  frame: CapturedFrame,
  onProgress?: UploadProgressCallback
): Promise<OCRResult> {
  try {
    console.log(`📤 Uploading frame: ${frame.angle}`);
    
    // Create form data
    const formData = new FormData();
    
    // Read file and create blob
    const fileInfo = await FileSystem.getInfoAsync(frame.uri);
    if (!fileInfo.exists) {
      throw new Error('Frame file not found');
    }
    
    // For React Native, we need to use the file URI directly
    const file = {
      uri: frame.uri,
      type: 'image/jpeg',
      name: `frame_${frame.angle}_${frame.timestamp}.jpg`,
    } as any;
    
    formData.append('image', file);
    formData.append('angle', frame.angle);
    
    // Upload with progress tracking
    const response = await apiClient.post<{ data: OCRResult }>(
      '/products/ocr',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    
    console.log(`✅ OCR completed: ${frame.angle}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ OCR failed for ${frame.angle}:`, error);
    throw handleAPIError(error);
  }
}

/**
 * Process multiple frames in sequence
 * 
 * @param frames - Array of frames to process
 * @param onProgress - Progress callback (0-100 for all frames)
 * @returns Map of angle to OCR result
 */
export async function processFrames(
  frames: CapturedFrame[],
  onProgress?: (status: OCRProcessingStatus) => void
): Promise<Map<string, OCRResult>> {
  const results = new Map<string, OCRResult>();
  const totalFrames = frames.length;
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    try {
      // Update status
      if (onProgress) {
        onProgress({
          status: 'processing',
          progress: Math.round((i / totalFrames) * 100),
          currentFrame: frame.angle,
          message: `Processing ${frame.angle} (${i + 1}/${totalFrames})`,
        });
      }
      
      // Process frame with retry logic
      const result = await processFrameWithRetry(frame, (frameProgress) => {
        if (onProgress) {
          const overallProgress = ((i + frameProgress / 100) / totalFrames) * 100;
          onProgress({
            status: 'uploading',
            progress: Math.round(overallProgress),
            currentFrame: frame.angle,
            message: `Uploading ${frame.angle}...`,
          });
        }
      });
      
      results.set(frame.angle, result);
      
    } catch (error) {
      console.error(`Failed to process frame ${frame.angle}:`, error);
      
      if (onProgress) {
        onProgress({
          status: 'error',
          progress: Math.round((i / totalFrames) * 100),
          currentFrame: frame.angle,
          error: `Failed to process ${frame.angle}`,
        });
      }
      
      // Continue with other frames instead of failing completely
      throw error;
    }
  }
  
  // Completed
  if (onProgress) {
    onProgress({
      status: 'completed',
      progress: 100,
      message: `Processed ${results.size}/${totalFrames} frames`,
    });
  }
  
  return results;
}

/**
 * Process frame with retry logic
 * 
 * @param frame - Frame to process
 * @param onProgress - Progress callback
 * @param retryCount - Current retry attempt
 * @returns OCR result
 */
async function processFrameWithRetry(
  frame: CapturedFrame,
  onProgress?: UploadProgressCallback,
  retryCount: number = 0
): Promise<OCRResult> {
  try {
    return await processFrame(frame, onProgress);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️ Retry ${retryCount + 1}/${MAX_RETRIES} for ${frame.angle}`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      
      return processFrameWithRetry(frame, onProgress, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Create product with OCR data
 * 
 * @param request - Scan request with frames
 * @param onProgress - Progress callback
 * @returns Scan response with product data
 */
export async function createProductWithOCR(
  request: OCRScanRequest,
  onProgress?: (status: OCRProcessingStatus) => void
): Promise<OCRScanResponse> {
  try {
    console.log('🚀 Starting product OCR scan...');
    
    // Process all frames
    const ocrResults = await processFrames(request.frames, onProgress);
    
    // Convert Map to object
    const resultsObject: { [angle: string]: OCRResult } = {};
    ocrResults.forEach((result, angle) => {
      resultsObject[angle] = result;
    });
    
    // Determine primary dates from all frames
    const primaryDates = determinePrimaryDates(ocrResults);
    
    // Create product with OCR data
    const response = await apiClient.post<OCRScanResponse>('/products', {
      name: request.productName,
      profileId: request.profileId,
      ocrResults: resultsObject,
      manufacturingDate: primaryDates.manufacturingDate,
      expiryDate: primaryDates.expiryDate,
    });
    
    console.log('✅ Product created with OCR data');
    return response.data;
    
  } catch (error) {
    console.error('❌ Failed to create product:', error);
    throw handleAPIError(error);
  }
}

// ==================================================================
// HELPER FUNCTIONS
// ==================================================================

/**
 * Determine primary dates from multiple OCR results
 * Prioritizes high confidence results
 * 
 * @param results - Map of OCR results
 * @returns Primary dates with confidence
 */
function determinePrimaryDates(results: Map<string, OCRResult>): {
  manufacturingDate: string | null;
  expiryDate: string | null;
  confidence: string;
} {
  let bestMfgDate: string | null = null;
  let bestMfgConfidence: 'high' | 'medium' | 'low' = 'low';
  let bestExpDate: string | null = null;
  let bestExpConfidence: 'high' | 'medium' | 'low' = 'low';
  
  // Priority: high > medium > low
  const confidencePriority = { high: 3, medium: 2, low: 1 };
  
  results.forEach((result, angle) => {
    // Check manufacturing date
    if (result.manufacturingDate) {
      const mfgConfidence = result.confidence.manufacturingDate;
      if (confidencePriority[mfgConfidence] > confidencePriority[bestMfgConfidence]) {
        bestMfgDate = result.manufacturingDate;
        bestMfgConfidence = mfgConfidence;
      }
    }
    
    // Check expiry date
    if (result.expiryDate) {
      const expConfidence = result.confidence.expiryDate;
      if (confidencePriority[expConfidence] > confidencePriority[bestExpConfidence]) {
        bestExpDate = result.expiryDate;
        bestExpConfidence = expConfidence;
      }
    }
  });
  
  // Overall confidence based on both dates
  let overallConfidence: string;
  if (bestMfgConfidence === 'high' && bestExpConfidence === 'high') {
    overallConfidence = 'high';
  } else if (bestMfgConfidence === 'low' || bestExpConfidence === 'low') {
    overallConfidence = 'low';
  } else {
    overallConfidence = 'medium';
  }
  
  return {
    manufacturingDate: bestMfgDate,
    expiryDate: bestExpDate,
    confidence: overallConfidence,
  };
}

/**
 * Handle API errors and convert to user-friendly messages
 * 
 * @param error - Error from API call
 * @returns Formatted error
 */
function handleAPIError(error: any): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response) {
      // Server responded with error
      const message = axiosError.response.data?.message || 'Server error occurred';
      const statusCode = axiosError.response.status;
      
      return new Error(`${message} (${statusCode})`);
    } else if (axiosError.request) {
      // No response received
      return new Error('Network error: Unable to reach server. Please check your connection.');
    }
  }
  
  return new Error(error.message || 'An unexpected error occurred');
}

// ==================================================================
// VALIDATION & QUALITY CHECKS
// ==================================================================

/**
 * Validate OCR result quality
 * 
 * @param result - OCR result to validate
 * @returns Validation result
 */
export function validateOCRResult(result: OCRResult): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check if any dates found
  if (!result.manufacturingDate && !result.expiryDate) {
    issues.push('No dates detected in image');
  }
  
  // Check confidence levels
  if (result.confidence.manufacturingDate === 'low' && result.manufacturingDate) {
    warnings.push('Manufacturing date has low confidence');
  }
  
  if (result.confidence.expiryDate === 'low' && result.expiryDate) {
    warnings.push('Expiry date has low confidence');
  }
  
  // Check quality issues
  if (result.qualityIssues.length > 0) {
    warnings.push(...result.qualityIssues);
  }
  
  // Check for warnings from backend
  if (result.warnings && result.warnings.length > 0) {
    warnings.push(...result.warnings);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Check if dates need manual verification
 * 
 * @param result - OCR result
 * @returns Whether manual verification is recommended
 */
export function needsManualVerification(result: OCRResult): boolean {
  const validation = validateOCRResult(result);
  
  // Needs verification if:
  // - Low confidence on critical dates
  // - Quality issues detected
  // - Dates calculated (not directly extracted)
  // - Any validation issues
  
  return (
    validation.issues.length > 0 ||
    result.confidence.manufacturingDate === 'low' ||
    result.confidence.expiryDate === 'low' ||
    result.qualityIssues.length > 0 ||
    result.calculatedExpiry === true
  );
}

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Format OCR result for display
 * 
 * @param result - OCR result
 * @returns Formatted string
 */
export function formatOCRResult(result: OCRResult): string {
  const lines: string[] = [];
  
  if (result.manufacturingDate) {
    lines.push(`MFG: ${result.manufacturingDate} (${result.confidence.manufacturingDate})`);
  }
  
  if (result.expiryDate) {
    lines.push(`EXP: ${result.expiryDate} (${result.confidence.expiryDate})`);
  }
  
  if (result.bestBeforeInfo) {
    lines.push(`Best Before: ${result.bestBeforeInfo}`);
  }
  
  if (result.qualityIssues.length > 0) {
    lines.push(`Quality Issues: ${result.qualityIssues.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Get user-friendly confidence label
 * 
 * @param confidence - Confidence level
 * @returns Formatted label with emoji
 */
export function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  const labels = {
    high: '✅ High Confidence',
    medium: '⚠️ Medium Confidence',
    low: '❌ Low Confidence',
  };
  return labels[confidence];
}

/**
 * Get recommended action based on OCR result
 * 
 * @param result - OCR result
 * @returns Recommended action message
 */
export function getRecommendedAction(result: OCRResult): string {
  if (!result.manufacturingDate && !result.expiryDate) {
    return 'No dates found. Please retake the photo with better lighting and focus.';
  }
  
  if (result.confidence.manufacturingDate === 'low' || result.confidence.expiryDate === 'low') {
    return 'Low confidence detected. Please verify dates manually or retake the photo.';
  }
  
  if (result.qualityIssues.length > 0) {
    return `Image quality issues: ${result.qualityIssues.join(', ')}. Consider retaking.`;
  }
  
  if (result.calculatedExpiry) {
    return 'Expiry date was calculated. Please verify it is correct.';
  }
  
  return 'Dates extracted successfully. Please verify before saving.';
}

/**
 * Test API connection
 * 
 * @returns Whether API is reachable
 */
export async function testAPIConnection(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

/**
 * Get API base URL (for debugging)
 * 
 * @returns Current API base URL
 */
export function getAPIBaseURL(): string {
  return API_BASE_URL;
}
