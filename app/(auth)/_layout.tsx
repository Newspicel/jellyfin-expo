import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'systemMaterial',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Connect to Server',
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="quick-connect"
        options={{
          title: 'Quick Connect',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
