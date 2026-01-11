import { Camera, CameraType } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  captureFrame,
  createCaptureSession,
  addFrameToSession,
  isSessionComplete,
  getMissingAngles,
  getCaptureProgress,
  getAngleLabel,
  getAngleInstruction,
  completeCaptureSession,
  type CapturedFrame,
  type CaptureSession,
} from '../utils/frameCapture';
import {
  initializeOCRService,
  type OCRResult,
  type OCRProcessingStatus,
} from '../services/ocrService';

interface ScanResult {
  ingredients?: string[];
  expiryDate?: string;
  manufacturingDate?: string;
  confidence: {
    ingredients?: 'high' | 'medium' | 'low';
    expiryDate?: 'high' | 'medium' | 'low';
    manufacturingDate?: 'high' | 'medium' | 'low';
  };
  extractedText: string;
  qualityIssues?: string[];
}

interface GuidedProductScanProps {
  onComplete: (result: ScanResult) => void;
  onCancel: () => void;
}

export default function GuidedProductScan({ onComplete, onCancel }: GuidedProductScanProps) {
  // Camera permission
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Scanning state
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [captureSession, setCaptureSession] = useState<CaptureSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Progress tracking
  const [progress, setProgress] = useState({
    hasProductInfo: false,
    hasIngredients: false,
    hasDates: false,
  });
  
  // OCR results from all angles
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);

  // Camera reference
  const cameraRef = useRef<Camera>(null);
  
  // Scan steps configuration
  const scanSteps = [
    { 
      angle: 'front' as const, 
      title: 'Front of Package', 
      instruction: 'Capture the product name and barcode clearly' 
    },
    { 
      angle: 'ingredients' as const, 
      title: 'Ingredients List', 
      instruction: 'Focus on the ingredients section' 
    },
    { 
      angle: 'top' as const, 
      title: 'Top/Bottom of Package', 
      instruction: 'Look for manufacturing and expiry dates' 
    },
    { 
      angle: 'back' as const, 
      title: 'Back of Package (Optional)', 
      instruction: 'Capture any additional information' 
    },
  ];

  const currentStep = scanSteps[currentAngleIndex];

  useEffect(() => {
    (async () => {
      try {
        // Request camera permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required for scanning products.');
          return;
        }

        // Initialize capture session
        const session = createCaptureSession();
        setCaptureSession(session);

        // Initialize OCR service with auth token
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Error', 'Authentication token not found. Please log in again.');
          return;
        }
        
        initializeOCRService(token);
        console.log('✅ GuidedProductScan initialized successfully');
      } catch (error) {
        console.error('❌ Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize camera');
      }
    })();

    // Cleanup on unmount
    return () => {
      if (captureSession) {
        completeCaptureSession(captureSession).catch(console.error);
      }
    };
  }, []);

  // Helper functions
  const getOCRServiceInstance = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    return initializeOCRService(token);
  };

  const updateProgress = (result: OCRResult) => {
    setProgress((prev) => ({
      hasProductInfo: prev.hasProductInfo || currentStep.angle === 'front',
      hasIngredients: prev.hasIngredients || result.ingredients.length > 0,
      hasDates: prev.hasDates || (result.manufacturingDate !== null || result.expiryDate !== null),
    }));
  };

  // Capture handler
  const handleCapture = async () => {
    if (!cameraRef.current || !captureSession) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('📸 Capturing photo...');

    try {
      console.log(`📸 Capturing ${currentStep.angle} angle`);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log('✅ Photo captured:', photo.uri);
      setProcessingStatus('🔄 Uploading to server...');

      const updatedSession = addFrameToSession(
        captureSession,
        photo.uri,
        currentStep.angle
      );
      setCaptureSession(updatedSession);

      const ocrService = await getOCRServiceInstance();
      
      console.log('🔄 Processing with OCR...');
      const result = await ocrService.processFrame(photo.uri, (uploadProgress) => {
        setProcessingStatus(`📤 Uploading... ${Math.round(uploadProgress)}%`);
      });

      console.log('✅ OCR result received');
      setOcrResults((prev) => [...prev, result]);
      updateProgress(result);

      if (result.qualityIssues.length > 0) {
        console.warn('⚠️ Quality issues detected:', result.qualityIssues);
        
        Alert.alert(
          '⚠️ Quality Warning',
          result.qualityIssues.join('\n') + '\n\nWould you like to retake this photo?',
          [
            { 
              text: 'Retake', 
              style: 'cancel',
              onPress: () => {
                setOcrResults((prev) => prev.slice(0, -1));
                setIsProcessing(false);
                setProcessingStatus('');
              }
            },
            { 
              text: 'Continue Anyway', 
              style: 'default',
              onPress: () => moveToNextStep()
            },
          ]
        );
      } else {
        moveToNextStep();
      }
    } catch (error: any) {
      console.error('❌ Capture error:', error);
      Alert.alert('Error', error.message || 'Failed to capture and process image. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Navigation functions
  const moveToNextStep = () => {
    if (currentAngleIndex < scanSteps.length - 1) {
      console.log(`➡️ Moving to step ${currentAngleIndex + 2}`);
      setCurrentAngleIndex((prev) => prev + 1);
      setIsProcessing(false);
      setProcessingStatus('');
    } else {
      console.log('✅ All steps completed, finishing scan');
      finishScan();
    }
  };

  const handleSkip = () => {
    if (currentAngleIndex === scanSteps.length - 1) {
      if (ocrResults.length === 0) {
        Alert.alert('Warning', 'No frames captured. Please capture at least one frame.', [{ text: 'OK' }]);
        return;
      }
      console.log('⏭️ Skipping last step, finishing with current results');
      finishScan();
    } else {
      console.log(`⏭️ Skipping step ${currentAngleIndex + 1}`);
      moveToNextStep();
    }
  };

  // Finish scan function
  const finishScan = async () => {
    setIsProcessing(true);
    setProcessingStatus('🔄 Merging results from all angles...');

    try {
      console.log(`📊 Merging ${ocrResults.length} OCR results`);
      const ocrService = await getOCRServiceInstance();
      
      const mergedResult = ocrService.mergeResults(ocrResults);

      const scanResult: ScanResult = {
        manufacturingDate: mergedResult.manufacturingDate,
        expiryDate: mergedResult.expiryDate,
        ingredients: mergedResult.ingredients,
        confidence: mergedResult.confidence,
        extractedText: mergedResult.rawText,
        qualityIssues: mergedResult.qualityIssues,
      };

      if (captureSession) {
        console.log('🧹 Cleaning up capture session');
        await completeCaptureSession(captureSession);
      }

      console.log('✅ Scan completed successfully');
      onComplete(scanResult);
    } catch (error: any) {
      console.error('❌ Finish scan error:', error);
      Alert.alert('Error', 'Failed to process scan results. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>📷 No access to camera</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera permissions in your device settings
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main camera view
  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
        <View style={styles.overlay}>
          {/* Header with step info */}
          <View style={styles.header}>
            <Text style={styles.stepTitle}>
              Step {currentAngleIndex + 1} of {scanSteps.length}
            </Text>
            <Text style={styles.stepSubtitle}>{currentStep.title}</Text>
            {processingStatus && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.processingStatus}>{processingStatus}</Text>
              </View>
            )}
          </View>

          {/* Center guide frame */}
          <View style={styles.centerGuide}>
            <View style={styles.scanFrame} />
            <Text style={styles.instruction}>{currentStep.instruction}</Text>
          </View>

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Text style={progress.hasProductInfo ? styles.progressActive : styles.progressInactive}>
                {progress.hasProductInfo ? '✅' : '○'} Product
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={progress.hasIngredients ? styles.progressActive : styles.progressInactive}>
                {progress.hasIngredients ? '✅' : '○'} Ingredients
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={progress.hasDates ? styles.progressActive : styles.progressInactive}>
                {progress.hasDates ? '✅' : '○'} Dates
              </Text>
            </View>
          </View>

          {/* Control buttons */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.secondaryButton, isProcessing && styles.buttonDisabled]} 
              onPress={onCancel}
              disabled={isProcessing}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, isProcessing && styles.buttonDisabled]} 
              onPress={handleSkip}
              disabled={isProcessing}
            >
              <Text style={styles.secondaryButtonText}>
                {currentAngleIndex === scanSteps.length - 1 ? 'Finish' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000', 
    padding: 20 
  },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
  errorText: { 
    color: '#ff6b6b', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  errorSubtext: { 
    color: '#fff', 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 30 
  },
  backButton: { 
    backgroundColor: '#4CAF50', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 8 
  },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center' },
  stepTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stepSubtitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  processingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    backgroundColor: 'rgba(76, 175, 80, 0.2)', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  processingStatus: { 
    color: '#4CAF50', 
    fontSize: 14, 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  centerGuide: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  scanFrame: { 
    width: 320, 
    height: 240, 
    borderWidth: 3, 
    borderColor: '#4CAF50', 
    borderRadius: 12, 
    backgroundColor: 'transparent' 
  },
  instruction: { 
    color: '#fff', 
    fontSize: 16, 
    marginTop: 20, 
    textAlign: 'center', 
    paddingHorizontal: 40, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  progressContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  progressItem: { alignItems: 'center' },
  progressActive: { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
  progressInactive: { color: '#fff', fontSize: 14, opacity: 0.6 },
  controls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  secondaryButton: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 8, 
    minWidth: 80, 
    alignItems: 'center' 
  },
  secondaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  captureButton: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5 
  },
  captureButtonDisabled: { opacity: 0.6 },
  captureButtonInner: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#4CAF50' 
  },
});
