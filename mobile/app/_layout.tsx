import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/create" />
      <Stack.Screen name="profile/select" />
      <Stack.Screen name="profile/medicines" />
      <Stack.Screen name="profile/medicines-add" />
      <Stack.Screen name="profile/medicines-edit" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/account" />
      <Stack.Screen name="settings/family" />
      <Stack.Screen name="settings/nuri" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/products" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/health" />
      <Stack.Screen name="settings/preferences" />
      <Stack.Screen name="settings/advanced" />
      <Stack.Screen name="settings/support" />
      <Stack.Screen name="settings/legal" />
      <Stack.Screen name="product/add" />
      <Stack.Screen name="product/detail" />
      <Stack.Screen name="nuri/index" />
    </Stack>
  );
}
