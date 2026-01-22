import { Stack } from 'expo-router';

export default function ItemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'systemChromeMaterial',
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="movie/[id]"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="series/[id]"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="season/[id]"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="episode/[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
}
