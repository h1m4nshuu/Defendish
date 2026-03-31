import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileAvatar from './ProfileAvatar';
import { profileService } from '../services/profile.service';

interface TabConfig {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
}

const TABS: TabConfig[] = [
  { name: 'index', icon: 'shopping', label: 'Products', color: '#17a2b8' },
  { name: 'dashboard', icon: 'chart-box-outline', label: 'Dashboard', color: '#6b7280' },
  { name: 'scan', icon: 'barcode-scan', label: 'Scan', color: '#2563eb' },
  { name: 'settings', icon: 'cog-outline', label: 'Settings', color: '#6b7280' },
  { name: 'profile', icon: 'account-circle-outline', label: 'Profile', color: '#2563eb' },
];

const COLORS = {
  primary: '#2563eb',
  secondary: '#17a2b8',
  inactive: '#9ca3af',
  white: '#ffffff',
  shadow: '#000000',
};

const CENTER_GAP = 86;

const CurvedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadCurrentProfile = async () => {
      try {
        const profile = await profileService.getCurrentProfile();
        if (mounted) {
          setCurrentProfile(profile);
        }
      } catch (error) {
        // Keep tab bar stable if profile cannot be loaded.
      }
    };

    loadCurrentProfile();
    const refreshInterval = setInterval(loadCurrentProfile, 3000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [state.index]);

  const animatedValues = useMemo(
    () =>
      state.routes.map(
        () => new Animated.Value(0)
      ),
    [state.routes.length]
  );

  const handleTabPress = (index: number, routeName: string) => {
    const route = state.routes[index];

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }

    // Animate the pressed tab
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: -6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Curved top background */}
      <View style={styles.curveContainer}>
        <View style={styles.curved} />
      </View>

      {/* Tab content */}
      <View style={styles.tabsContent}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabConfig = TABS.find((t) => t.name === route.name);

          if (!tabConfig) return null;

          const animatedStyle = {
            transform: [{ translateY: animatedValues[index] }],
          };

          // Center scan button - different styling
          if (tabConfig.name === 'scan') {
            return (
              <Animated.View
                key={route.key}
                style={[styles.centerTabContainer, animatedStyle]}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  onPress={() => handleTabPress(index, route.name)}
                  style={[
                    styles.centerTabButton,
                    isFocused && styles.centerTabButtonActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.scanIconContainer}>
                    <MaterialCommunityIcons
                      name={tabConfig.icon}
                      size={28}
                      color={isFocused ? '#ffffff' : '#2563eb'}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }

          // Regular side tabs
          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabButton,
                index < 2 && styles.tabButtonLeft,
                index > 2 && styles.tabButtonRight,
                index === 1 && styles.nearCenterLeft,
                index === 3 && styles.nearCenterRight,
                animatedStyle,
              ]}
            >
              <TouchableOpacity
                onPress={() => handleTabPress(index, route.name)}
                style={[
                  styles.tabContent,
                  isFocused && styles.tabContentActive,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    isFocused && [
                      styles.iconWrapperActive,
                      { backgroundColor: tabConfig.color + '15' },
                    ],
                  ]}
                >
                  {tabConfig.name === 'profile' && currentProfile?.photoUrl ? (
                    <ProfileAvatar
                      name={currentProfile?.name || 'Profile'}
                      photoUrl={currentProfile?.photoUrl}
                      size={28}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={tabConfig.icon}
                      size={24}
                      color={isFocused ? tabConfig.color : COLORS.inactive}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingTop: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  curveContainer: {
    height: 40,
    overflow: 'hidden',
  },
  curved: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderBottomWidth: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  tabButtonLeft: {
    marginRight: 6,
  },
  tabButtonRight: {
    marginLeft: 6,
  },
  nearCenterLeft: {
    marginRight: CENTER_GAP / 2,
  },
  nearCenterRight: {
    marginLeft: CENTER_GAP / 2,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabContentActive: {
    // Additional styling for active state
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: '#f0f9ff',
  },
  centerTabContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  centerTabButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
  },
  centerTabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#1e40af',
  },
  scanIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CurvedTabBar;
