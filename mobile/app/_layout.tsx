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
      <Stack.Screen name="product/add" />
      <Stack.Screen name="product/detail" />
    </Stack>
  );
}
