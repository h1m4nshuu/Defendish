/**
 * Demo script for ImagePreprocessor utility
 * 
 * This demonstrates how to use the ImagePreprocessor class
 * to enhance images for better OCR accuracy.
 * 
 * Usage:
 * tsx src/utils/imagePreprocessing.demo.ts <path-to-image>
 */

import { imagePreprocessor } from './imagePreprocessing';
import path from 'path';

async function demo() {
  // Get image path from command line or use default
  const imagePath = process.argv[2] || path.join(__dirname, '../../uploads/products/sample.jpg');

  console.log('\n==============================================');
  console.log('📸 IMAGE PREPROCESSING DEMO');
  console.log('==============================================\n');

  try {
    // Step 1: Analyze image quality
    console.log('STEP 1: Analyzing Image Quality');
    console.log('----------------------------------------------');
    const quality = await imagePreprocessor.analyzeQuality(imagePath);
    
    console.log('\n📊 Quality Analysis Results:');
    console.log(`   Dimensions: ${quality.width}x${quality.height}`);
    console.log(`   Format: ${quality.format}`);
    console.log(`   File Size: ${(quality.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Avg Brightness: ${quality.avgBrightness}/255`);
    console.log(`   Is Blurry: ${quality.isBlurry ? '⚠️  Yes' : '✅ No'}`);
    console.log(`   Is Too Dark: ${quality.isTooDark ? '⚠️  Yes' : '✅ No'}`);
    console.log(`   Is Too Light: ${quality.isTooLight ? '⚠️  Yes' : '✅ No'}`);

    // Get recommendations
    const recommendations = imagePreprocessor.getRecommendations(quality);
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`   - ${rec}`));

    // Step 2: Preprocess image
    console.log('\n\nSTEP 2: Preprocessing Image');
    console.log('----------------------------------------------');
    const processedImages = await imagePreprocessor.preprocess(imagePath);

    console.log('\n✨ Preprocessed Images Created:');
    processedImages.forEach((img, index) => {
      console.log(`   ${index + 1}. ${path.basename(img)}`);
    });

    // Step 3: Analyze preprocessed images
    console.log('\n\nSTEP 3: Analyzing Preprocessed Images');
    console.log('----------------------------------------------');
    
    for (let i = 0; i < processedImages.length; i++) {
      const processedQuality = await imagePreprocessor.analyzeQuality(processedImages[i]);
      console.log(`\n📊 Version ${i + 1} Analysis:`);
      console.log(`   Avg Brightness: ${processedQuality.avgBrightness}/255`);
      console.log(`   Quality: ${processedQuality.isBlurry ? '⚠️  Blurry' : '✅ Sharp'}`);
    }

    // Step 4: Cleanup (optional)
    console.log('\n\nSTEP 4: Cleanup (Optional)');
    console.log('----------------------------------------------');
    console.log('To clean up preprocessed images, use:');
    console.log('await imagePreprocessor.cleanup(processedImages);');
    console.log('\nPreprocessed images kept for inspection.');

    console.log('\n==============================================');
    console.log('✅ DEMO COMPLETE');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { demo };
