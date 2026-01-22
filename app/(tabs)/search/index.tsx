import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSearchStore } from '@/stores/search.store';
import { useColors, spacing } from '@/theme';

export default function SearchScreen() {
  const colors = useColors();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const hasQuery = query.trim().length > 0;
  const navigation = useNavigation();
  const searchBarRef = useRef<SearchBarCommands | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  const handleSearchSubmit = useCallback(() => {
    setIsSearching(false);
    Keyboard.dismiss();
    searchBarRef.current?.blur();
  }, []);

  // Set up search bar options with ref
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerSearchBarOptions: {
          ref: searchBarRef as React.RefObject<SearchBarCommands>,
          placeholder: 'Search movies, shows, and more',
          hideWhenScrolling: false,
          hideNavigationBar: false,
          onChangeText: (e: { nativeEvent: { text: string } }) => {
            setQuery(e.nativeEvent.text);
            if (!isSearching) {
              setIsSearching(true);
            }
          },
          onSearchButtonPress: handleSearchSubmit,
          onFocus: () => setIsSearching(true),
        },
      });

      // Focus search bar when screen comes into focus
      if (isSearching) {
        const timer = setTimeout(() => {
          searchBarRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [navigation, setQuery, handleSearchSubmit, isSearching])
  );

  if (!hasQuery) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <ThemedView style={styles.emptyContent}>
          <ThemedText style={[styles.emptyText, { color: colors.text.secondary }]}>
            Search for movies, shows, and more
          </ThemedText>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Results for &ldquo;{query}&rdquo;</ThemedText>
        {/* TODO: Implement search results */}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {},
});
