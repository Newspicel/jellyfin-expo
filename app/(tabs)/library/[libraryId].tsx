import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from '@/components/media/poster-card';
import { useAuthStore } from '@/stores/auth.store';
import {
  getItemsOptions,
  getItemOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';

const NUM_COLUMNS = 3;
const CARD_WIDTH = 110;

export default function LibraryItemsScreen() {
  const { libraryId } = useLocalSearchParams<{ libraryId: string }>();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch the library info to get the name
  const { data: libraryInfo } = useQuery({
    ...getItemOptions({
      path: { itemId: libraryId! },
    }),
    enabled: !!libraryId && !!currentUser?.Id,
  });

  // Fetch items in the library
  const {
    data: itemsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...getItemsOptions({
      query: {
        parentId: libraryId,
        sortBy: ['SortName'],
        sortOrder: ['Ascending'],
        recursive: true,
        fields: ['PrimaryImageAspectRatio'],
        enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
        imageTypeLimit: 1,
        limit: 100,
      },
    }),
    enabled: !!libraryId && !!currentUser?.Id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: BaseItemDto }) => (
      <View style={styles.cardWrapper}>
        <PosterCard
          item={item}
          width={CARD_WIDTH}
          showProgress={true}
        />
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: BaseItemDto) => item.Id ?? '', []);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: libraryInfo?.Name ?? 'Library' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: libraryInfo?.Name ?? 'Library' }} />
        <View style={styles.errorContainer}>
          <ThemedText>Failed to load items</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const items = itemsData?.Items ?? [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: libraryInfo?.Name ?? 'Library' }} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>No items found</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});
