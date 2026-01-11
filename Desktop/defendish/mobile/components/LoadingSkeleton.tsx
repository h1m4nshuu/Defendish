import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Spacing';

interface LoadingSkeletonProps {
  variant?: 'product-card' | 'product-detail' | 'dashboard-stats' | 'list-item' | 'circle' | 'rect';
  width?: number | string;
  height?: number;
  borderRadius?: number;
  colorScheme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  colorScheme = 'light',
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const colors = Colors[colorScheme];

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const baseSkeletonStyle: ViewStyle = {
    backgroundColor: colorScheme === 'light' ? '#E5E7EB' : '#374151',
    borderRadius,
    width: width as any,
    height,
  };

  if (variant === 'product-card') {
    return (
      <Animated.View style={[styles.productCard, { opacity }, style]}>
        <View style={[styles.productImage, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
        <View style={styles.productContent}>
          <View style={[styles.productTitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={[styles.productSubtitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={styles.productBadges}>
            <View style={[styles.badge, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
            <View style={[styles.badge, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          </View>
        </View>
      </Animated.View>
    );
  }

  if (variant === 'product-detail') {
    return (
      <Animated.View style={[styles.productDetail, { opacity }, style]}>
        <View style={[styles.detailImage, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
        <View style={styles.detailContent}>
          <View style={[styles.detailTitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={[styles.detailSubtitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={[styles.detailDescription, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={[styles.detailDescription, { backgroundColor: baseSkeletonStyle.backgroundColor, width: '80%' }]} />
        </View>
      </Animated.View>
    );
  }

  if (variant === 'dashboard-stats') {
    return (
      <Animated.View style={[styles.dashboardStats, { opacity }, style]}>
        <View style={[styles.statCard, { backgroundColor: baseSkeletonStyle.backgroundColor }]}>
          <View style={[styles.statNumber, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
          <View style={[styles.statLabel, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
        </View>
        <View style={[styles.statCard, { backgroundColor: baseSkeletonStyle.backgroundColor }]}>
          <View style={[styles.statNumber, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
          <View style={[styles.statLabel, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
        </View>
        <View style={[styles.statCard, { backgroundColor: baseSkeletonStyle.backgroundColor }]}>
          <View style={[styles.statNumber, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
          <View style={[styles.statLabel, { backgroundColor: colorScheme === 'light' ? '#D1D5DB' : '#4B5563' }]} />
        </View>
      </Animated.View>
    );
  }

  if (variant === 'list-item') {
    return (
      <Animated.View style={[styles.listItem, { opacity }, style]}>
        <View style={[styles.listItemImage, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
        <View style={styles.listItemContent}>
          <View style={[styles.listItemTitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
          <View style={[styles.listItemSubtitle, { backgroundColor: baseSkeletonStyle.backgroundColor }]} />
        </View>
      </Animated.View>
    );
  }

  if (variant === 'circle') {
    return (
      <Animated.View
        style={[
          baseSkeletonStyle,
          {
            borderRadius: BorderRadius.full,
            width: height,
            opacity,
          },
          style,
        ]}
      />
    );
  }

  // Default rect variant
  return <Animated.View style={[baseSkeletonStyle, { opacity }, style]} />;
};

const styles = StyleSheet.create({
  // Product Card
  productCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  productContent: {
    gap: Spacing.sm,
  },
  productTitle: {
    height: 20,
    borderRadius: BorderRadius.sm,
  },
  productSubtitle: {
    height: 16,
    width: '70%',
    borderRadius: BorderRadius.sm,
  },
  productBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  badge: {
    width: 60,
    height: 24,
    borderRadius: BorderRadius.full,
  },

  // Product Detail
  productDetail: {
    gap: Spacing.base,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.lg,
  },
  detailContent: {
    gap: Spacing.md,
  },
  detailTitle: {
    height: 28,
    borderRadius: BorderRadius.md,
  },
  detailSubtitle: {
    height: 20,
    width: '60%',
    borderRadius: BorderRadius.sm,
  },
  detailDescription: {
    height: 16,
    borderRadius: BorderRadius.sm,
  },

  // Dashboard Stats
  dashboardStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  statNumber: {
    height: 32,
    borderRadius: BorderRadius.md,
  },
  statLabel: {
    height: 16,
    width: '70%',
    borderRadius: BorderRadius.sm,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  listItemContent: {
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  listItemTitle: {
    height: 18,
    borderRadius: BorderRadius.sm,
  },
  listItemSubtitle: {
    height: 14,
    width: '70%',
    borderRadius: BorderRadius.sm,
  },
});
