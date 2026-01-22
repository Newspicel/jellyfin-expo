import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSearchStore } from '@/stores/search.store';

export default function SearchScreen() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const hasQuery = query.trim().length > 0;
  const navigation = useNavigation();
  const router = useRouter();
  const searchBarRef = useRef<SearchBarCommands | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  const handleCancel = useCallback(() => {
    setQuery('');
    setIsSearching(true);
    router.back();
  }, [router, setQuery]);

  const handleSearchSubmit = useCallback(() => {
    setIsSearching(false);
    Keyboard.dismiss();
    searchBarRef.current?.blur();
    // Hide cancel button after blur
    setTimeout(() => {
      searchBarRef.current?.toggleCancelButton(false);
    }, 100);
  }, []);

  // Set up search bar options with ref
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerSearchBarOptions: {
          ref: searchBarRef as React.RefObject<SearchBarCommands>,
          placeholder: 'Search movies, shows, and more',
          onChangeText: (e: { nativeEvent: { text: string } }) => {
            setQuery(e.nativeEvent.text);
            if (!isSearching) {
              setIsSearching(true);
            }
          },
          onSearchButtonPress: handleSearchSubmit,
          onCancelButtonPress: handleCancel,
          onClose: handleCancel,
          onFocus: () => setIsSearching(true),
        },
      });

      // Focus search bar when screen comes into focus
      if (isSearching) {
        const timer = setTimeout(() => {
          searchBarRef.current?.focus();
          searchBarRef.current?.toggleCancelButton(true);
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [navigation, setQuery, handleCancel, handleSearchSubmit, isSearching])
  );

  if (!hasQuery) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <ThemedView style={styles.emptyContent}>
          <ThemedText style={styles.emptyText}>
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
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    opacity: 0.6,
  },
});
