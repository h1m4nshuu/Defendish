import { ImagePreprocessor } from '../src/utils/imagePreprocessing';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

describe('ImagePreprocessor', () => {
  const preprocessor = new ImagePreprocessor();
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
  const testOutputDir = path.join(__dirname, 'fixtures', 'output');
  let processedImages: string[] = [];

  // Create test fixtures before tests
  beforeAll(async () => {
    // Create test directories
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }

    // Create a test image (100x100 white square with black text-like pattern)
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .jpeg()
      .toFile(testImagePath);
  });

  // Cleanup after tests
  afterAll(async () => {
    // Clean up test files
    if (processedImages.length > 0) {
      await preprocessor.cleanup(processedImages);
    }
    
    // Remove test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Remove test directories
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(testOutputDir)) {
      fs.rmdirSync(testOutputDir, { recursive: true });
    }
    if (fs.existsSync(fixturesDir)) {
      fs.rmdirSync(fixturesDir, { recursive: true });
    }
  });

  describe('preprocess', () => {
    it('should create 3 preprocessed versions of an image', async () => {
      processedImages = await preprocessor.preprocess(testImagePath);

      expect(processedImages).toHaveLength(3);
      expect(processedImages[0]).toContain('_processed1');
      expect(processedImages[1]).toContain('_processed2');
      expect(processedImages[2]).toContain('_processed3');

      // Verify all files exist
      processedImages.forEach(imagePath => {
        expect(fs.existsSync(imagePath)).toBe(true);
      });
    });

    it('should create images with specified output directory', async () => {
      const customProcessed = await preprocessor.preprocess(testImagePath, {
        outputDir: testOutputDir
      });

      expect(customProcessed.every(p => p.includes(testOutputDir))).toBe(true);

      // Cleanup custom processed images
      await preprocessor.cleanup(customProcessed);
    });

    it('should throw error for non-existent image', async () => {
      await expect(
        preprocessor.preprocess('non-existent-image.jpg')
      ).rejects.toThrow('Image file not found');
    });

    it('should create images in specified format', async () => {
      const pngProcessed = await preprocessor.preprocess(testImagePath, {
        outputFormat: 'png',
        outputDir: testOutputDir
      });

      expect(pngProcessed.every(p => p.endsWith('.png'))).toBe(true);

      // Cleanup
      await preprocessor.cleanup(pngProcessed);
    });
  });

  describe('analyzeQuality', () => {
    it('should return quality analysis with correct structure', async () => {
      const analysis = await preprocessor.analyzeQuality(testImagePath);

      expect(analysis).toHaveProperty('width');
      expect(analysis).toHaveProperty('height');
      expect(analysis).toHaveProperty('isBlurry');
      expect(analysis).toHaveProperty('isTooDark');
      expect(analysis).toHaveProperty('isTooLight');
      expect(analysis).toHaveProperty('avgBrightness');
      expect(analysis).toHaveProperty('fileSize');
      expect(analysis).toHaveProperty('format');

      expect(typeof analysis.width).toBe('number');
      expect(typeof analysis.height).toBe('number');
      expect(typeof analysis.isBlurry).toBe('boolean');
      expect(typeof analysis.isTooDark).toBe('boolean');
      expect(typeof analysis.isTooLight).toBe('boolean');
      expect(typeof analysis.avgBrightness).toBe('number');
      expect(typeof analysis.fileSize).toBe('number');
      expect(typeof analysis.format).toBe('string');
    });

    it('should detect image dimensions correctly', async () => {
      const analysis = await preprocessor.analyzeQuality(testImagePath);

      expect(analysis.width).toBe(100);
      expect(analysis.height).toBe(100);
    });

    it('should throw error for non-existent image', async () => {
      await expect(
        preprocessor.analyzeQuality('non-existent-image.jpg')
      ).rejects.toThrow('Image file not found');
    });

    it('should detect if image is too light', async () => {
      const analysis = await preprocessor.analyzeQuality(testImagePath);

      // Our test image is white, so it should be too light
      expect(analysis.isTooLight).toBe(true);
      expect(analysis.avgBrightness).toBeGreaterThan(200);
    });
  });

  describe('cleanup', () => {
    it('should delete all provided image paths', async () => {
      const tempProcessed = await preprocessor.preprocess(testImagePath, {
        outputDir: testOutputDir
      });

      // Verify files exist
      tempProcessed.forEach(imagePath => {
        expect(fs.existsSync(imagePath)).toBe(true);
      });

      // Cleanup
      await preprocessor.cleanup(tempProcessed);

      // Verify files are deleted
      tempProcessed.forEach(imagePath => {
        expect(fs.existsSync(imagePath)).toBe(false);
      });
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentPaths = [
        'non-existent-1.jpg',
        'non-existent-2.jpg'
      ];

      // Should not throw
      await expect(
        preprocessor.cleanup(nonExistentPaths)
      ).resolves.not.toThrow();
    });

    it('should handle empty array gracefully', async () => {
      await expect(
        preprocessor.cleanup([])
      ).resolves.not.toThrow();
    });
  });

  describe('getRecommendations', () => {
    it('should provide recommendation for blurry images', () => {
      const analysis = {
        width: 1920,
        height: 1080,
        isBlurry: true,
        isTooDark: false,
        isTooLight: false,
        avgBrightness: 128,
        fileSize: 1024000,
        format: 'jpeg'
      };

      const recommendations = preprocessor.getRecommendations(analysis);

      expect(recommendations).toContain('Image appears blurry - try taking a sharper photo');
    });

    it('should provide recommendation for dark images', () => {
      const analysis = {
        width: 1920,
        height: 1080,
        isBlurry: false,
        isTooDark: true,
        isTooLight: false,
        avgBrightness: 40,
        fileSize: 1024000,
        format: 'jpeg'
      };

      const recommendations = preprocessor.getRecommendations(analysis);

      expect(recommendations).toContain('Image is too dark - improve lighting or increase brightness');
    });

    it('should provide recommendation for light images', () => {
      const analysis = {
        width: 1920,
        height: 1080,
        isBlurry: false,
        isTooDark: false,
        isTooLight: true,
        avgBrightness: 220,
        fileSize: 1024000,
        format: 'jpeg'
      };

      const recommendations = preprocessor.getRecommendations(analysis);

      expect(recommendations).toContain('Image is overexposed - reduce lighting or decrease brightness');
    });

    it('should provide recommendation for low resolution images', () => {
      const analysis = {
        width: 640,
        height: 480,
        isBlurry: false,
        isTooDark: false,
        isTooLight: false,
        avgBrightness: 128,
        fileSize: 1024000,
        format: 'jpeg'
      };

      const recommendations = preprocessor.getRecommendations(analysis);

      expect(recommendations).toContain('Image resolution is low - use a higher resolution camera');
    });

    it('should provide positive feedback for good quality images', () => {
      const analysis = {
        width: 1920,
        height: 1080,
        isBlurry: false,
        isTooDark: false,
        isTooLight: false,
        avgBrightness: 128,
        fileSize: 1024000,
        format: 'jpeg'
      };

      const recommendations = preprocessor.getRecommendations(analysis);

      expect(recommendations).toContain('Image quality is good for OCR processing');
    });
  });
});
