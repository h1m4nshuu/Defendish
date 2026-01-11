import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';

interface SuccessAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
  size?: number;
  colorScheme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  onComplete,
  duration = 2000,
  size = 80,
  colorScheme = 'light',
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);

      // Start animations
      Animated.sequence([
        // Fade in and scale circle
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Scale checkmark with bounce
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        // Hold for a moment
        Animated.delay(duration - 500),
        // Fade out
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }, [visible, duration, scaleAnim, opacityAnim, checkmarkScale, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.success,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.checkmark,
            {
              transform: [{ scale: checkmarkScale }],
            },
          ]}
        >
          <View style={[styles.checkmarkStem, { backgroundColor: 'white' }]} />
          <View style={[styles.checkmarkKick, { backgroundColor: 'white' }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  checkmarkStem: {
    position: 'absolute',
    width: 3,
    height: 16,
    left: 13,
    top: 4,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkKick: {
    position: 'absolute',
    width: 3,
    height: 8,
    left: 6,
    top: 12,
    transform: [{ rotate: '-45deg' }],
  },
});
