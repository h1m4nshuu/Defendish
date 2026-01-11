import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { TextStyles, FontWeight } from '../constants/Typography';
import { Spacing, BorderRadius, IconSize } from '../constants/Spacing';
import { Button } from '../components/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingScreen {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const screens: OnboardingScreen[] = [
  {
    id: 1,
    icon: '📱',
    title: 'Scan Products Easily',
    description: 'Simply scan the barcode and we\'ll fetch all the details automatically',
  },
  {
    id: 2,
    icon: '🤖',
    title: 'AI Detects Allergens',
    description: 'Our AI analyzes ingredients and identifies all potential allergens instantly',
  },
  {
    id: 3,
    icon: '⚠️',
    title: 'Get Personalized Warnings',
    description: 'Set your allergens and get instant warnings on products that aren\'t safe for you',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [colorScheme] = useState<'light' | 'dark'>('light');
  const colors = Colors[colorScheme];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
      },
    }
  );

  const scrollTo = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        {screens.map((screen) => (
          <View key={screen.id} style={styles.screen}>
            <View style={styles.content}>
              {/* Icon/Illustration */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{screen.icon}</Text>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {screen.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {screen.description}
              </Text>

              {/* Visual Illustration */}
              {screen.id === 1 && (
                <View style={styles.illustration}>
                  <View style={[styles.phoneFrame, { borderColor: colors.border }]}>
                    <View style={styles.phoneScanLine} />
                    <Text style={styles.barcodeText}>||||| ||||| |||||</Text>
                  </View>
                </View>
              )}

              {screen.id === 2 && (
                <View style={styles.illustration}>
                  <View style={[styles.ingredientsList, { backgroundColor: colors.card }]}>
                    <Text style={[styles.ingredientItem, { color: colors.text }]}>
                      Wheat flour
                    </Text>
                    <Text style={[styles.ingredientItem, styles.highlightedIngredient]}>
                      🚨 Peanuts
                    </Text>
                    <Text style={[styles.ingredientItem, { color: colors.text }]}>
                      Sugar, Salt
                    </Text>
                    <Text style={[styles.ingredientItem, styles.highlightedIngredient]}>
                      🚨 Milk
                    </Text>
                  </View>
                </View>
              )}

              {screen.id === 3 && (
                <View style={styles.illustration}>
                  <View style={[styles.productCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.productImage, { backgroundColor: colors.backgroundSecondary }]} />
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.text }]}>
                        Chocolate Bar
                      </Text>
                      <View style={styles.warningBadge}>
                        <Text style={styles.warningText}>⚠️ Contains Allergens</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dot Indicators */}
        <View style={styles.pagination}>
          {screens.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={currentIndex === screens.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
            colorScheme={colorScheme}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: Spacing.base,
    zIndex: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...TextStyles.body,
    fontWeight: FontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['3xl'],
  },
  iconContainer: {
    marginBottom: Spacing['2xl'],
  },
  icon: {
    fontSize: IconSize['3xl'] * 2,
  },
  title: {
    ...TextStyles.h1,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  description: {
    ...TextStyles.bodyLarge,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 340,
    marginBottom: Spacing['2xl'],
  },
  illustration: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  // Screen 1: Phone scanning
  phoneFrame: {
    width: 200,
    height: 300,
    borderWidth: 3,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  phoneScanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#4A90E2',
    marginBottom: Spacing.base,
  },
  barcodeText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  // Screen 2: Ingredients
  ingredientsList: {
    width: 280,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  ingredientItem: {
    ...TextStyles.body,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  highlightedIngredient: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontWeight: FontWeight.semibold,
  },
  // Screen 3: Product with warning
  productCard: {
    width: 280,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  productInfo: {
    gap: Spacing.sm,
  },
  productName: {
    ...TextStyles.h4,
  },
  warningBadge: {
    backgroundColor: '#FEF2F2',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  warningText: {
    ...TextStyles.labelSmall,
    color: '#DC2626',
    fontWeight: FontWeight.semibold,
  },
  // Bottom section
  bottomSection: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Platform.OS === 'ios' ? Spacing['3xl'] : Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  buttonContainer: {
    width: '100%',
  },
});
