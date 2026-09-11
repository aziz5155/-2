import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="parent-login" />
      <Stack.Screen name="parent-signup" />
      <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
      <Stack.Screen name="child-login" />
      <Stack.Screen name="create-family" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
