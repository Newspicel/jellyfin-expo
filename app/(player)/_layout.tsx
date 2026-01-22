import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PlayerLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="[itemId]" />
      </Stack>
    </>
  );
}
