import { Drawer } from 'expo-router/drawer';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const tabs = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'library', title: 'Library', icon: 'rectangle.stack.fill' },
  { name: 'search', title: 'Search', icon: 'magnifyingglass' },
  { name: 'settings', title: 'Settings', icon: 'gearshape.fill' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeTintColor = Colors[colorScheme ?? 'light'].tint;

  // Use Drawer for TV platforms, Tabs for mobile/tablet
  if (Platform.isTV) {
    return (
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: activeTintColor,
          drawerType: 'permanent',
          drawerStyle: {
            width: 240,
          },
        }}>
        {tabs.map((tab) => (
          <Drawer.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              drawerIcon: ({ color }) => (
                <IconSymbol size={24} name={tab.icon} color={color} />
              ),
            }}
          />
        ))}
      </Drawer>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
