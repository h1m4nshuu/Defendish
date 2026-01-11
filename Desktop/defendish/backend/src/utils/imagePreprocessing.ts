import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Options for image preprocessing
 */
export interface PreprocessingOptions {
  /** Output format for preprocessed images (default: original format) */
  outputFormat?: 'jpeg' | 'png' | 'webp';
  /** Quality for JPEG/WebP output (1-100, default: 90) */
  quality?: number;
  /** Output directory (default: same as input) */
  outputDir?: string;
}

/**
 * Image quality analysis result
 */
export interface QualityAnalysis {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** True if image appears blurry (low variance) */
  isBlurry: boolean;
  /** True if image is too dark (avg brightness < 50) */
  isTooDark: boolean;
  /** True if image is too light (avg brightness > 200) */
  isTooLight: boolean;
  /** Average brightness value (0-255) */
  avgBrightness: number;
  /** File size in bytes */
  fileSize: number;
  /** Image format */
  format: string;
}

/**
 * ImagePreprocessor - Advanced image preprocessing utility for OCR optimization
 * 
 * Creates multiple preprocessed versions of an image to improve OCR accuracy:
 * - Version 1: Standard preprocessing (contrast, brightness, sharpening)
 * - Version 2: High contrast binary (threshold-based)
 * - Version 3: Edge enhancement (for detecting text boundaries)
 */
export class ImagePreprocessor {
  /**
   * Preprocess an image into multiple versions optimized for OCR
   * 
   * @param imagePath - Path to the original image
   * @param options - Preprocessing options
   * @returns Array of paths to preprocessed images
   * 
   * @example
   * ```typescript
   * const preprocessor = new ImagePreprocessor();
   * const processed = await preprocessor.preprocess('product.jpg');
   * // Returns: ['product_processed1.jpg', 'product_processed2.jpg', 'product_processed3.jpg']
   * ```
   */
  async preprocess(
    imagePath: string,
    options: PreprocessingOptions = {}
  ): Promise<string[]> {
    try {
      // Validate input file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const parsedPath = path.parse(imagePath);
      const outputDir = options.outputDir || parsedPath.dir;
      const baseFormat = options.outputFormat || parsedPath.ext.slice(1) as any;
      const quality = options.quality || 90;

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const processedPaths: string[] = [];

      // Load the original image once
      const originalImage = sharp(imagePath);
      const metadata = await originalImage.metadata();

      console.log(`📸 Preprocessing image: ${parsedPath.base}`);
      console.log(`   Original size: ${metadata.width}x${metadata.height}`);

      // VERSION 1: Standard Preprocessing
      // Optimized for general text recognition
      const version1Path = path.join(
        outputDir,
        `${parsedPath.name}_processed1.${baseFormat}`
      );

      await sharp(imagePath)
        .grayscale() // Convert to grayscale
        .normalise() // Normalize histogram for better contrast
        .linear(1.5, 0) // Increase contrast (1.5x multiplier)
        .modulate({ brightness: 1.2 }) // Increase brightness by 20%
        .sharpen({ sigma: 1.5 }) // Sharpen edges
        .median(3) // Denoise with median filter
        .toFormat(baseFormat as any, { quality })
        .toFile(version1Path);

      processedPaths.push(version1Path);
      console.log(`   ✅ Version 1 (Standard): ${path.basename(version1Path)}`);

      // VERSION 2: High Contrast Binary
      // Optimized for high-contrast text scenarios
      const version2Path = path.join(
        outputDir,
        `${parsedPath.name}_processed2.${baseFormat}`
      );

      await sharp(imagePath)
        .grayscale()
        .normalise()
        .linear(2.0, 0) // High contrast (2.0x multiplier)
        .threshold(128) // Binary threshold at midpoint
        .toFormat(baseFormat as any, { quality })
        .toFile(version2Path);

      processedPaths.push(version2Path);
      console.log(`   ✅ Version 2 (Binary): ${path.basename(version2Path)}`);

      // VERSION 3: Edge Enhancement
      // Optimized for detecting text boundaries
      const version3Path = path.join(
        outputDir,
        `${parsedPath.name}_processed3.${baseFormat}`
      );

      // Edge detection using convolution kernel
      const edgeKernel = {
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      };

      await sharp(imagePath)
        .grayscale()
        .normalise()
        .convolve(edgeKernel) // Apply edge detection
        .modulate({ brightness: 1.3 }) // Brighten edges
        .toFormat(baseFormat as any, { quality })
        .toFile(version3Path);

      processedPaths.push(version3Path);
      console.log(`   ✅ Version 3 (Edge Enhanced): ${path.basename(version3Path)}`);

      console.log(`✨ Preprocessing complete: ${processedPaths.length} versions created`);
      return processedPaths;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Preprocessing failed: ${errorMessage}`);
      throw new Error(`Failed to preprocess image: ${errorMessage}`);
    }
  }

  /**
   * Clean up preprocessed images
   * 
   * @param imagePaths - Array of image paths to delete
   * 
   * @example
   * ```typescript
   * await preprocessor.cleanup(processedImages);
   * // Deletes all preprocessed images
   * ```
   */
  async cleanup(imagePaths: string[]): Promise<void> {
    try {
      console.log(`🧹 Cleaning up ${imagePaths.length} preprocessed images...`);
      
      let deletedCount = 0;
      let failedCount = 0;

      for (const imagePath of imagePaths) {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            deletedCount++;
            console.log(`   ✅ Deleted: ${path.basename(imagePath)}`);
          } else {
            console.log(`   ⚠️  File not found: ${path.basename(imagePath)}`);
          }
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`   ❌ Failed to delete ${path.basename(imagePath)}: ${errorMessage}`);
        }
      }

      console.log(`✨ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Cleanup failed: ${errorMessage}`);
      // Don't throw - cleanup should be non-fatal
    }
  }

  /**
   * Analyze image quality for OCR suitability
   * 
   * @param imagePath - Path to the image to analyze
   * @returns Quality analysis results
   * 
   * @example
   * ```typescript
   * const quality = await preprocessor.analyzeQuality('product.jpg');
   * // Returns: { width: 1920, height: 1080, isBlurry: false, isTooDark: false, isTooLight: false, ... }
   * ```
   */
  async analyzeQuality(imagePath: string): Promise<QualityAnalysis> {
    try {
      // Validate input file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      console.log(`🔍 Analyzing image quality: ${path.basename(imagePath)}`);

      const image = sharp(imagePath);
      
      // Get image metadata
      const metadata = await image.metadata();
      const stats = fs.statSync(imagePath);

      // Convert to grayscale and get pixel statistics
      const { data } = await image
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i++) {
        totalBrightness += data[i];
      }
      const avgBrightness = totalBrightness / data.length;

      // Calculate variance to detect blur (low variance = blurry)
      let variance = 0;
      for (let i = 0; i < data.length; i++) {
        variance += Math.pow(data[i] - avgBrightness, 2);
      }
      variance = variance / data.length;
      const standardDeviation = Math.sqrt(variance);

      // Blur detection: low standard deviation indicates uniform (blurry) image
      // Typical threshold: < 30 for very blurry, < 50 for somewhat blurry
      const isBlurry = standardDeviation < 50;

      const analysis: QualityAnalysis = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        isBlurry,
        isTooDark: avgBrightness < 50,
        isTooLight: avgBrightness > 200,
        avgBrightness: Math.round(avgBrightness),
        fileSize: stats.size,
        format: metadata.format || 'unknown',
      };

      console.log(`   📊 Dimensions: ${analysis.width}x${analysis.height}`);
      console.log(`   💡 Avg Brightness: ${analysis.avgBrightness}/255`);
      console.log(`   🎯 Std Deviation: ${Math.round(standardDeviation)}`);
      console.log(`   ${analysis.isBlurry ? '⚠️  Blurry' : '✅ Sharp'}`);
      console.log(`   ${analysis.isTooDark ? '⚠️  Too Dark' : analysis.isTooLight ? '⚠️  Too Light' : '✅ Good Brightness'}`);

      return analysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Quality analysis failed: ${errorMessage}`);
      throw new Error(`Failed to analyze image quality: ${errorMessage}`);
    }
  }

  /**
   * Get recommendations for improving OCR accuracy based on quality analysis
   * 
   * @param analysis - Quality analysis result
   * @returns Array of recommendation strings
   */
  getRecommendations(analysis: QualityAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.isBlurry) {
      recommendations.push('Image appears blurry - try taking a sharper photo');
    }

    if (analysis.isTooDark) {
      recommendations.push('Image is too dark - improve lighting or increase brightness');
    }

    if (analysis.isTooLight) {
      recommendations.push('Image is overexposed - reduce lighting or decrease brightness');
    }

    if (analysis.width < 800 || analysis.height < 600) {
      recommendations.push('Image resolution is low - use a higher resolution camera');
    }

    if (recommendations.length === 0) {
      recommendations.push('Image quality is good for OCR processing');
    }

    return recommendations;
  }
}

// Export singleton instance for convenience
export const imagePreprocessor = new ImagePreprocessor();
