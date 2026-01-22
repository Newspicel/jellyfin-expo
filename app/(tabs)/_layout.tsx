import { Drawer } from 'expo-router/drawer';
import {
  NativeTabs,
  Icon,
  Label,
} from 'expo-router/unstable-native-tabs';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSearchStore } from '@/stores/search.store';

const tabs = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'library', title: 'Library', icon: 'rectangle.stack.fill' },
  { name: 'search', title: 'Search', icon: 'magnifyingglass' },
  { name: 'settings', title: 'Settings', icon: 'gearshape.fill' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeTintColor = Colors[colorScheme ?? 'light'].tint;
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const setPreviousTab = useSearchStore((s) => s.setPreviousTab);

  // Track previous tab when navigating to search
  useEffect(() => {
    const isSearchPath = pathname.includes('/search');
    const wasSearchPath = previousPathRef.current?.includes('/search');

    if (isSearchPath && !wasSearchPath && previousPathRef.current) {
      setPreviousTab(previousPathRef.current);
    }

    previousPathRef.current = pathname;
  }, [pathname, setPreviousTab]);

  // Use Drawer for TV platforms, NativeTabs for mobile/tablet
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
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <Icon sf="rectangle.stack.fill" />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <Icon sf="magnifyingglass" />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
