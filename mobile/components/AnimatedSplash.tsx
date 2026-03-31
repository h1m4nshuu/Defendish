import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
  duration?: number;
}

/**
 * Professional Animated Splash Screen Component
 * Features:
 * - Smooth fade-in with scale animation
 * - Defendish logo with subtle rotation
 * - Pulsing loading indicator dots
 * - Fully customizable timing and appearance
 */

export default function AnimatedSplash({
  onAnimationComplete,
  duration = 3000,
}: AnimatedSplashProps) {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withTiming(1, {
      duration,
      easing: Easing.inOut(Easing.ease),
    });

    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  // Scale animation - starts at 0.3, overshoots to 1.1, settles to 1
  const scaleAnimated = useAnimatedStyle(() => {
    const scale = interpolate(
      animationProgress.value,
      [0, 0.3, 1],
      [0.3, 1.1, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  // Fade in animation with easing
  const fadeAnimated = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [0, 0.8, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  // Subtle rotation for visual interest
  const rotationAnimated = useAnimatedStyle(() => {
    const rotation = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 5],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background} />

      {/* Logo Container with Animations */}
      <Animated.View style={[styles.logoContainer, fadeAnimated]}>
        <Animated.View style={[scaleAnimated, rotationAnimated]}>
          <Image
            source={require('@/assets/defendish-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      {/* Brand Name Text */}
      <Animated.View style={[styles.textContainer, fadeAnimated]}>
        <Animated.Text 
          style={[
            styles.brandName, 
            { opacity: animationProgress }
          ]}
        >
          Defendish
        </Animated.Text>
      </Animated.View>

      {/* Loading Indicator Dots */}
      <View style={styles.dotsContainer}>
        <AnimatedDot delay={0} progress={animationProgress} />
        <AnimatedDot delay={200} progress={animationProgress} />
        <AnimatedDot delay={400} progress={animationProgress} />
      </View>
    </View>
  );
}

/**
 * Animated Dot Component for Loading Indicator
 * Creates pulsing effect with staggered timing
 */
function AnimatedDot({ delay, progress }: { delay: number; progress: any }) {
  const dotAnimation = useAnimatedStyle(() => {
    // Stagger the animation based on delay
    const adjustedProgress = Math.max(0, progress.value - delay / 1200);
    
    // Scale animation with pulse effect
    const scale = interpolate(
      adjustedProgress,
      [0, 0.3, 0.6, 1],
      [0.3, 1, 0.8, 0.3],
      Extrapolate.CLAMP
    );

    // Opacity animation
    const opacity = interpolate(
      adjustedProgress,
      [0, 0.3, 1],
      [0, 1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.dot, dotAnimation]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 1.5,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
});
