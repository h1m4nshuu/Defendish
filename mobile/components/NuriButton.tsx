import { useRef, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface NuriButtonProps {
  source: 'home' | 'product';
  context?: Record<string, unknown>;
  bottomOffset?: number;
  style?: ViewStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function NuriButton({
  source,
  context,
  bottomOffset = 100,
  style,
}: NuriButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation
  useEffect(() => {
    const pulseSequence = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    const loopAnimation = Animated.loop(pulseSequence);
    loopAnimation.start();

    return () => loopAnimation.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    router.push({
      pathname: '/nuri',
      params: {
        source,
        context: context ? JSON.stringify(context) : undefined,
      },
    });
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        {
          bottom: bottomOffset + insets.bottom,
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open Nuri AI assistant"
      accessibilityHint="Ask Nuri for product recommendations and food safety advice"
    >
      {/* Pulse ring background */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.05],
              outputRange: [0.3, 0],
            }),
          },
        ]}
      />

      {/* Button background */}
      <View style={styles.buttonBackground}>
        <MaterialCommunityIcons name="robot-happy" size={28} color="#ffffff" />
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    opacity: 0.3,
  },
  buttonBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 14,
  },
});
