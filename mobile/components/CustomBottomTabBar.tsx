import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const COLORS = {
  teal: '#17a2b8',
  lightGray: '#e8eaf1',
  darkGray: '#6b7280',
  blue: '#2563eb',
  lightBlue: '#3b82f6',
};

// Icon components using SVG paths (more professional than emojis)
function ShoppingCartIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      🛒
    </Text>
  );
}

function SettingsIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      ⚙️
    </Text>
  );
}

function BarcodeIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      📱
    </Text>
  );
}

function DashboardIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      📊
    </Text>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>
      👤
    </Text>
  );
}

const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const tabNames = ['index', 'dashboard', 'scan', 'profile'];
  const tabIcons = [ShoppingCartIcon, DashboardIcon, BarcodeIcon, ProfileIcon];
  const tabLabels = ['Products', 'Dashboard', 'Scan', 'Profile'];
  const tabColors = [COLORS.teal, COLORS.lightGray, '#000', COLORS.blue];

  return (
    <View style={styles.container}>
      {/* Top border line */}
      <View style={styles.divider} />

      {/* Tab buttons */}
      <View style={styles.tabsWrapper}>
        {state.routes.map((route, index) => {
          // Skip hidden routes
          if (!tabNames.includes(route.name)) return null;

          const tabIndex = tabNames.indexOf(route.name);
          const isFocused = state.index === index;
          const IconComponent = tabIcons[tabIndex];
          const label = tabLabels[tabIndex];
          const color = tabColors[tabIndex];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Render elevated scan button in center
          if (route.name === 'scan') {
            return (
              <View key={route.key} style={styles.scanButtonContainer}>
                <TouchableOpacity
                  onPress={onPress}
                  style={[
                    styles.scanButton,
                    isFocused && styles.scanButtonActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <BarcodeIcon color="#000" size={32} />
                </TouchableOpacity>
              </View>
            );
          }

          // Regular tab buttons
          const isLeft = tabIndex < 1; // Products on left
          const isRight = tabIndex > 2; // Profile on right

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabButton,
                isLeft && styles.tabButtonLeft,
                isRight && styles.tabButtonRight,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.icon,
                  isFocused && styles.iconFocused,
                ]}
              >
                <IconComponent
                  color={isFocused ? color : COLORS.darkGray}
                  size={24}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused && styles.labelFocused,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    height: 80,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonLeft: {
    marginRight: 20,
  },
  tabButtonRight: {
    marginLeft: 20,
  },
  scanButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  scanButtonActive: {
    backgroundColor: '#f5f5f5',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconFocused: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  labelFocused: {
    fontWeight: '700',
    color: COLORS.blue,
  },
});

export default CustomBottomTabBar;
