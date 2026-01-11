/**
 * Frame Capture Utility for Mobile App
 * 
 * Provides functionality to capture frames from camera for OCR processing
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// ==================================================================
// TYPES & INTERFACES
// ==================================================================

/**
 * Represents a captured frame from the camera
 */
export interface CapturedFrame {
  uri: string;              // Local file URI
  timestamp: number;        // When captured (Unix timestamp)
  angle: 'front' | 'back' | 'top' | 'ingredients';  // Which angle
}

/**
 * Frame capture configuration options
 */
export interface FrameCaptureOptions {
  quality?: number;         // Image quality (0-1), default: 0.8
  compress?: boolean;       // Whether to compress image, default: true
  maxWidth?: number;        // Max width in pixels, default: 1920
  maxHeight?: number;       // Max height in pixels, default: 1080
  format?: 'jpeg' | 'png';  // Image format, default: 'jpeg'
}

/**
 * Frame validation result
 */
export interface FrameValidation {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Capture session to track multiple frames
 */
export interface CaptureSession {
  sessionId: string;
  frames: CapturedFrame[];
  startTime: number;
  endTime?: number;
}

// ==================================================================
// CONSTANTS
// ==================================================================

const DEFAULT_OPTIONS: Required<FrameCaptureOptions> = {
  quality: 0.8,
  compress: true,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'jpeg',
};

const FRAME_DIRECTORY = `${FileSystem.documentDirectory}frames/`;

// Required angles for complete product scan
export const REQUIRED_ANGLES: CapturedFrame['angle'][] = [
  'front',
  'back',
  'top',
  'ingredients',
];

// ==================================================================
// FRAME CAPTURE FUNCTIONS
// ==================================================================

/**
 * Initialize frame capture directory
 * Creates the directory if it doesn't exist
 */
export async function initializeFrameDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FRAME_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FRAME_DIRECTORY, { intermediates: true });
      console.log('✅ Frame directory created:', FRAME_DIRECTORY);
    }
  } catch (error) {
    console.error('❌ Error creating frame directory:', error);
    throw new Error('Failed to initialize frame directory');
  }
}

/**
 * Capture and process a frame from camera photo
 * 
 * @param photoUri - URI of the captured photo
 * @param angle - Which angle this frame represents
 * @param options - Capture options
 * @returns Processed CapturedFrame
 */
export async function captureFrame(
  photoUri: string,
  angle: CapturedFrame['angle'],
  options: FrameCaptureOptions = {}
): Promise<CapturedFrame> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Ensure directory exists
    await initializeFrameDirectory();
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `frame_${angle}_${timestamp}.${opts.format}`;
    const destUri = `${FRAME_DIRECTORY}${filename}`;
    
    // Process image (resize, compress)
    if (opts.compress) {
      console.log('📸 Processing frame:', angle);
      
      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          {
            resize: {
              width: opts.maxWidth,
              height: opts.maxHeight,
            },
          },
        ],
        {
          compress: opts.quality,
          format: opts.format === 'jpeg' 
            ? ImageManipulator.SaveFormat.JPEG 
            : ImageManipulator.SaveFormat.PNG,
        }
      );
      
      // Move processed image to frame directory
      await FileSystem.moveAsync({
        from: manipResult.uri,
        to: destUri,
      });
      
      console.log(`✅ Frame captured: ${angle} (${timestamp})`);
    } else {
      // Just copy without processing
      await FileSystem.copyAsync({
        from: photoUri,
        to: destUri,
      });
    }
    
    const frame: CapturedFrame = {
      uri: destUri,
      timestamp,
      angle,
    };
    
    return frame;
  } catch (error) {
    console.error('❌ Error capturing frame:', error);
    throw new Error(`Failed to capture frame for angle: ${angle}`);
  }
}

/**
 * Validate frame quality and completeness
 * 
 * @param frameUri - URI of frame to validate
 * @returns Validation result with issues and recommendations
 */
export async function validateFrame(frameUri: string): Promise<FrameValidation> {
  const validation: FrameValidation = {
    isValid: true,
    issues: [],
    recommendations: [],
  };
  
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(frameUri);
    
    if (!fileInfo.exists) {
      validation.isValid = false;
      validation.issues.push('Frame file does not exist');
      return validation;
    }
    
    // Check file size
    if (fileInfo.size === 0) {
      validation.isValid = false;
      validation.issues.push('Frame file is empty');
      return validation;
    }
    
    // Check minimum size (at least 10KB)
    if (fileInfo.size < 10 * 1024) {
      validation.isValid = false;
      validation.issues.push('Frame file too small (possible corruption)');
      return validation;
    }
    
    // Check maximum size (max 10MB)
    if (fileInfo.size > 10 * 1024 * 1024) {
      validation.recommendations.push('Frame file is large, consider reducing quality');
    }
    
    // Additional recommendations
    if (fileInfo.size > 5 * 1024 * 1024) {
      validation.recommendations.push('Large file size may slow upload');
    }
    
    console.log(`✅ Frame validated: ${fileInfo.size} bytes`);
  } catch (error) {
    console.error('❌ Error validating frame:', error);
    validation.isValid = false;
    validation.issues.push('Failed to validate frame');
  }
  
  return validation;
}

/**
 * Delete a single frame
 * 
 * @param frameUri - URI of frame to delete
 */
export async function deleteFrame(frameUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(frameUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(frameUri);
      console.log('🗑️  Frame deleted:', frameUri);
    }
  } catch (error) {
    console.error('❌ Error deleting frame:', error);
    throw new Error('Failed to delete frame');
  }
}

/**
 * Delete multiple frames
 * 
 * @param frames - Array of frames to delete
 */
export async function deleteFrames(frames: CapturedFrame[]): Promise<void> {
  const deletePromises = frames.map(frame => deleteFrame(frame.uri));
  await Promise.all(deletePromises);
  console.log(`🗑️  Deleted ${frames.length} frames`);
}

/**
 * Clean up all frames in the directory
 * Useful for clearing temporary data
 */
export async function cleanupFrameDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FRAME_DIRECTORY);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(FRAME_DIRECTORY, { idempotent: true });
      console.log('🧹 Frame directory cleaned');
      
      // Recreate empty directory
      await initializeFrameDirectory();
    }
  } catch (error) {
    console.error('❌ Error cleaning frame directory:', error);
    throw new Error('Failed to cleanup frame directory');
  }
}

// ==================================================================
// CAPTURE SESSION MANAGEMENT
// ==================================================================

/**
 * Create a new capture session
 * 
 * @returns New capture session
 */
export function createCaptureSession(): CaptureSession {
  const session: CaptureSession = {
    sessionId: `session_${Date.now()}`,
    frames: [],
    startTime: Date.now(),
  };
  
  console.log('📋 New capture session created:', session.sessionId);
  return session;
}

/**
 * Add frame to capture session
 * 
 * @param session - Capture session
 * @param frame - Frame to add
 */
export function addFrameToSession(
  session: CaptureSession,
  frame: CapturedFrame
): CaptureSession {
  const updatedSession = {
    ...session,
    frames: [...session.frames, frame],
  };
  
  console.log(`📸 Frame added to session: ${frame.angle} (${session.frames.length + 1}/${REQUIRED_ANGLES.length})`);
  return updatedSession;
}

/**
 * Complete capture session
 * 
 * @param session - Capture session to complete
 * @returns Completed session
 */
export function completeCaptureSession(session: CaptureSession): CaptureSession {
  const completedSession = {
    ...session,
    endTime: Date.now(),
  };
  
  const duration = ((completedSession.endTime - session.startTime) / 1000).toFixed(1);
  console.log(`✅ Capture session completed: ${session.frames.length} frames in ${duration}s`);
  return completedSession;
}

/**
 * Check if session has all required angles
 * 
 * @param session - Capture session to check
 * @returns Whether all required angles are captured
 */
export function isSessionComplete(session: CaptureSession): boolean {
  const capturedAngles = session.frames.map(f => f.angle);
  const hasAllAngles = REQUIRED_ANGLES.every(angle => capturedAngles.includes(angle));
  return hasAllAngles;
}

/**
 * Get missing angles from session
 * 
 * @param session - Capture session
 * @returns Array of missing angles
 */
export function getMissingAngles(session: CaptureSession): CapturedFrame['angle'][] {
  const capturedAngles = session.frames.map(f => f.angle);
  return REQUIRED_ANGLES.filter(angle => !capturedAngles.includes(angle));
}

/**
 * Get frame by angle from session
 * 
 * @param session - Capture session
 * @param angle - Angle to find
 * @returns Frame or undefined if not found
 */
export function getFrameByAngle(
  session: CaptureSession,
  angle: CapturedFrame['angle']
): CapturedFrame | undefined {
  return session.frames.find(f => f.angle === angle);
}

/**
 * Replace frame in session (for retaking photos)
 * 
 * @param session - Capture session
 * @param angle - Angle to replace
 * @param newFrame - New frame
 * @returns Updated session
 */
export async function replaceFrameInSession(
  session: CaptureSession,
  angle: CapturedFrame['angle'],
  newFrame: CapturedFrame
): Promise<CaptureSession> {
  // Find and delete old frame
  const oldFrame = getFrameByAngle(session, angle);
  if (oldFrame) {
    await deleteFrame(oldFrame.uri);
  }
  
  // Replace in array
  const updatedFrames = session.frames.filter(f => f.angle !== angle);
  updatedFrames.push(newFrame);
  
  const updatedSession = {
    ...session,
    frames: updatedFrames,
  };
  
  console.log(`🔄 Frame replaced: ${angle}`);
  return updatedSession;
}

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Get frame file size in bytes
 * 
 * @param frameUri - URI of frame
 * @returns File size in bytes
 */
export async function getFrameSize(frameUri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(frameUri);
    return fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
  } catch (error) {
    console.error('❌ Error getting frame size:', error);
    return 0;
  }
}

/**
 * Get total size of all frames in session
 * 
 * @param session - Capture session
 * @returns Total size in bytes
 */
export async function getSessionTotalSize(session: CaptureSession): Promise<number> {
  const sizePromises = session.frames.map(frame => getFrameSize(frame.uri));
  const sizes = await Promise.all(sizePromises);
  return sizes.reduce((total, size) => total + size, 0);
}

/**
 * Format file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get capture progress percentage
 * 
 * @param session - Capture session
 * @returns Progress percentage (0-100)
 */
export function getCaptureProgress(session: CaptureSession): number {
  return Math.round((session.frames.length / REQUIRED_ANGLES.length) * 100);
}

/**
 * Get human-readable angle label
 * 
 * @param angle - Frame angle
 * @returns Formatted label
 */
export function getAngleLabel(angle: CapturedFrame['angle']): string {
  const labels: Record<CapturedFrame['angle'], string> = {
    front: 'Front Label',
    back: 'Back Label',
    top: 'Top/MRP',
    ingredients: 'Ingredients List',
  };
  return labels[angle];
}

/**
 * Get angle instruction for user
 * 
 * @param angle - Frame angle
 * @returns Instruction text
 */
export function getAngleInstruction(angle: CapturedFrame['angle']): string {
  const instructions: Record<CapturedFrame['angle'], string> = {
    front: 'Capture the front of the package with product name and brand clearly visible',
    back: 'Capture the back of the package with nutritional information and dates',
    top: 'Capture the top showing MRP, manufacturing date, and expiry date',
    ingredients: 'Capture the ingredients list with all text clearly readable',
  };
  return instructions[angle];
}
