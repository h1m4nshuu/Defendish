# Image Preprocessing Utility

## Overview

The `ImagePreprocessor` class provides advanced image preprocessing capabilities specifically optimized for OCR (Optical Character Recognition). It creates multiple versions of an image with different preprocessing techniques to maximize text recognition accuracy.

## Features

### ✨ Core Capabilities

1. **Multi-Version Preprocessing**: Creates 3 optimized versions of each image
   - **Version 1 (Standard)**: Balanced preprocessing for general text
   - **Version 2 (Binary)**: High contrast binary for clear text
   - **Version 3 (Edge Enhanced)**: Edge detection for text boundaries

2. **Quality Analysis**: Analyzes image quality to determine OCR suitability
   - Detects blur
   - Checks brightness levels
   - Measures resolution
   - Provides actionable recommendations

3. **Smart Cleanup**: Safe deletion of preprocessed images with error handling

## Installation

The utility uses the Sharp library (already installed in the project):

```bash
npm install sharp
```

## Usage

### Basic Example

```typescript
import { imagePreprocessor } from './utils/imagePreprocessing';

// Preprocess an image
const processedImages = await imagePreprocessor.preprocess('product.jpg');
// Returns: ['product_processed1.jpg', 'product_processed2.jpg', 'product_processed3.jpg']

// Analyze quality
const quality = await imagePreprocessor.analyzeQuality('product.jpg');
console.log(quality);
// {
//   width: 1920,
//   height: 1080,
//   isBlurry: false,
//   isTooDark: false,
//   isTooLight: false,
//   avgBrightness: 142,
//   fileSize: 524288,
//   format: 'jpeg'
// }

// Get recommendations
const recommendations = imagePreprocessor.getRecommendations(quality);
console.log(recommendations);
// ['Image quality is good for OCR processing']

// Clean up
await imagePreprocessor.cleanup(processedImages);
```

### Advanced Example with Options

```typescript
import { ImagePreprocessor } from './utils/imagePreprocessing';

const preprocessor = new ImagePreprocessor();

// Preprocess with custom options
const processedImages = await preprocessor.preprocess('photo.jpg', {
  outputFormat: 'png',           // Convert to PNG
  quality: 95,                   // High quality (1-100)
  outputDir: './processed'       // Custom output directory
});

// Process multiple images
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
const allProcessed = [];

for (const img of images) {
  const quality = await preprocessor.analyzeQuality(img);
  
  if (!quality.isBlurry && !quality.isTooDark) {
    const processed = await preprocessor.preprocess(img);
    allProcessed.push(...processed);
  }
}

// Clean up all at once
await preprocessor.cleanup(allProcessed);
```

## API Reference

### `ImagePreprocessor`

#### Methods

##### `preprocess(imagePath: string, options?: PreprocessingOptions): Promise<string[]>`

Creates 3 preprocessed versions of an image optimized for OCR.

**Parameters:**
- `imagePath` (string): Path to the original image
- `options` (PreprocessingOptions, optional):
  - `outputFormat`: 'jpeg' | 'png' | 'webp' (default: original format)
  - `quality`: 1-100 (default: 90)
  - `outputDir`: Custom output directory (default: same as input)

**Returns:** Array of paths to preprocessed images

**Throws:** Error if image file not found or processing fails

**Example:**
```typescript
const processed = await preprocessor.preprocess('image.jpg', {
  outputFormat: 'png',
  quality: 95,
  outputDir: './temp'
});
```

---

##### `analyzeQuality(imagePath: string): Promise<QualityAnalysis>`

Analyzes image quality for OCR suitability.

**Parameters:**
- `imagePath` (string): Path to the image to analyze

**Returns:** QualityAnalysis object with:
- `width` (number): Image width in pixels
- `height` (number): Image height in pixels
- `isBlurry` (boolean): True if image appears blurry
- `isTooDark` (boolean): True if avg brightness < 50
- `isTooLight` (boolean): True if avg brightness > 200
- `avgBrightness` (number): Average brightness (0-255)
- `fileSize` (number): File size in bytes
- `format` (string): Image format

**Throws:** Error if image file not found or analysis fails

**Example:**
```typescript
const quality = await preprocessor.analyzeQuality('image.jpg');
if (quality.isBlurry) {
  console.log('Warning: Image is blurry');
}
```

---

##### `cleanup(imagePaths: string[]): Promise<void>`

Deletes preprocessed images safely.

**Parameters:**
- `imagePaths` (string[]): Array of image paths to delete

**Returns:** Promise<void>

**Note:** Non-fatal - errors are logged but don't throw

**Example:**
```typescript
await preprocessor.cleanup(processedImages);
```

---

##### `getRecommendations(analysis: QualityAnalysis): string[]`

Provides recommendations for improving OCR accuracy.

**Parameters:**
- `analysis` (QualityAnalysis): Quality analysis result

**Returns:** Array of recommendation strings

**Example:**
```typescript
const quality = await preprocessor.analyzeQuality('image.jpg');
const recs = preprocessor.getRecommendations(quality);
recs.forEach(rec => console.log(`- ${rec}`));
```

## Preprocessing Techniques

### Version 1: Standard Preprocessing

Optimized for general text recognition with balanced settings.

**Operations:**
1. Convert to grayscale
2. Normalize histogram (better contrast distribution)
3. Increase contrast by 1.5x
4. Increase brightness by 20%
5. Sharpen edges (sigma: 1.5)
6. Denoise with median filter (size: 3)

**Best for:** General product labels, receipts, documents

---

### Version 2: High Contrast Binary

Creates a binary (black/white) image for maximum contrast.

**Operations:**
1. Convert to grayscale
2. Normalize histogram
3. Increase contrast by 2.0x (aggressive)
4. Apply binary threshold at midpoint (128)

**Best for:** Clean printed text, high-contrast labels, barcodes

---

### Version 3: Edge Enhancement

Emphasizes text boundaries using edge detection.

**Operations:**
1. Convert to grayscale
2. Normalize histogram
3. Apply edge detection kernel (Laplacian)
4. Brighten edges by 30%

**Best for:** Faded text, low-contrast packaging, embossed text

## Quality Analysis

### Blur Detection

Uses standard deviation of pixel intensities:
- **Sharp images**: High variance (σ > 50)
- **Blurry images**: Low variance (σ < 50)

### Brightness Analysis

Analyzes average pixel brightness:
- **Too Dark**: avgBrightness < 50
- **Good**: 50 ≤ avgBrightness ≤ 200
- **Too Light**: avgBrightness > 200

### Resolution Check

Minimum recommended resolution: 800x600 pixels

## Integration Example

### With OCR Service

```typescript
import { imagePreprocessor } from './utils/imagePreprocessing';
import { performOCR } from './services/ai.service';

async function extractTextFromImage(imagePath: string) {
  // 1. Analyze quality
  const quality = await imagePreprocessor.analyzeQuality(imagePath);
  
  if (quality.isBlurry || quality.isTooDark) {
    console.warn('Image quality issues detected');
  }

  // 2. Preprocess image
  const processedImages = await imagePreprocessor.preprocess(imagePath);

  // 3. Try OCR on each version
  const results = [];
  for (const img of processedImages) {
    try {
      const text = await performOCR(img);
      results.push({ image: img, text, confidence: calculateConfidence(text) });
    } catch (error) {
      console.error(`OCR failed for ${img}:`, error);
    }
  }

  // 4. Select best result
  const best = results.reduce((a, b) => 
    a.confidence > b.confidence ? a : b
  );

  // 5. Cleanup
  await imagePreprocessor.cleanup(processedImages);

  return best.text;
}
```

## Testing

Run the test suite:

```bash
npm test -- imagePreprocessing
```

Test coverage includes:
- ✅ Creating preprocessed versions
- ✅ Quality analysis
- ✅ Cleanup operations
- ✅ Error handling
- ✅ Recommendations
- ✅ Custom output formats
- ✅ Custom output directories

## Demo Script

Run the interactive demo:

```bash
tsx src/utils/imagePreprocessing.demo.ts <path-to-image>
```

The demo will:
1. Analyze image quality
2. Create preprocessed versions
3. Compare quality metrics
4. Show recommendations

## Performance

Typical processing times (on standard hardware):

| Operation | Time |
|-----------|------|
| Single image preprocessing | 100-300ms |
| Quality analysis | 50-150ms |
| Cleanup (3 files) | 10-20ms |

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const processed = await preprocessor.preprocess('image.jpg');
} catch (error) {
  console.error('Preprocessing failed:', error.message);
  // Handle error appropriately
}
```

**Common errors:**
- `Image file not found` - Invalid file path
- `Failed to preprocess image` - Sharp processing error
- `Failed to analyze image quality` - Analysis error

## Best Practices

1. **Always analyze quality first** before preprocessing
2. **Use multiple versions** for better OCR accuracy
3. **Clean up preprocessed images** to save disk space
4. **Handle errors gracefully** in production
5. **Cache quality analysis** if processing same image multiple times

## Limitations

- Requires Sharp library
- Processing time increases with image size
- Disk space needed for temporary preprocessed images
- Best results with images >800x600 resolution

## Future Enhancements

Potential improvements:
- Adaptive preprocessing based on quality analysis
- Custom preprocessing pipelines
- Batch processing optimization
- GPU acceleration for large images
- ML-based quality prediction

## License

Part of the Defendish project.
