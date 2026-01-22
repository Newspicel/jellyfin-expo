import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from '@/components/media/poster-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/auth.store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  getItemsOptions,
  getItemOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';

const NUM_COLUMNS = 3;
const CARD_WIDTH = 110;

export default function LibraryItemsScreen() {
  const { libraryId } = useLocalSearchParams<{ libraryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'dark'].tint;
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

  const libraryName = libraryInfo?.Name ?? 'Library';

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={24} color={tintColor} />
      </Pressable>
      <ThemedText type="title" style={styles.headerTitle}>
        {libraryName}
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <ThemedText>Failed to load items</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const items = itemsData?.Items ?? [];

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
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
