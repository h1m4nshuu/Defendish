import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CurvedTabBar from '../../components/CurvedTabBar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 85 + insets.bottom,
          paddingBottom: 0,
        },
        sceneContainerStyle: {
          paddingBottom: 85 + insets.bottom,
        },
      }}
      tabBar={(props) => <CurvedTabBar {...props} />}
    >
      {/* Products - Left */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
        }}
      />

      {/* Dashboard - Left Center */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />

      {/* Scan - Center (Elevated) */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
        }}
      />

      {/* Settings - Right Center */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />

      {/* Profile - Right */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />

      {/* Hidden Products route */}
      <Tabs.Screen
        name="products"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
