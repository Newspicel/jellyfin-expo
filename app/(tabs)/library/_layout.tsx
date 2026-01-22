import { Stack } from 'expo-router';

export default function LibraryLayout() {
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
          title: 'Library',
        }}
      />
      <Stack.Screen
        name="[libraryId]"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
}
