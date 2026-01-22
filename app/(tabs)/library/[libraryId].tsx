import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from '@/components/media/poster-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/auth.store';
import {
  getItemsOptions,
  getItemOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';
import { useColors, spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = spacing.md * 2;
const MIN_CARD_WIDTH = 100;
const MAX_CARD_WIDTH = 140;
const CARD_GAP = spacing.sm;

// Calculate optimal columns and card width
function calculateGridLayout() {
  const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING;
  // Start with 3 columns and adjust
  let numColumns = Math.floor(availableWidth / (MIN_CARD_WIDTH + CARD_GAP));
  numColumns = Math.max(3, Math.min(6, numColumns)); // Between 3 and 6 columns
  const cardWidth = Math.min(
    MAX_CARD_WIDTH,
    (availableWidth - (numColumns - 1) * CARD_GAP) / numColumns
  );
  return { numColumns, cardWidth };
}

const PAGE_SIZE = 50;

export default function LibraryItemsScreen() {
  const { libraryId } = useLocalSearchParams<{ libraryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { numColumns, cardWidth } = useMemo(() => calculateGridLayout(), []);

  // Fetch the library info to get the name
  const { data: libraryInfo } = useQuery({
    ...getItemOptions({
      path: { itemId: libraryId! },
    }),
    enabled: !!libraryId && !!currentUser?.Id,
  });

  // Manual pagination state
  const [startIndex, setStartIndex] = useState(0);
  const [allItems, setAllItems] = useState<BaseItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const {
    data: pageData,
    isLoading: isLoadingPage,
    isFetching,
    error,
    refetch: refetchPage,
  } = useQuery({
    ...getItemsOptions({
      query: {
        parentId: libraryId,
        sortBy: ['SortName'],
        sortOrder: ['Ascending'],
        recursive: true,
        enableImages: true,
        enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
        imageTypeLimit: 1,
        limit: PAGE_SIZE,
        startIndex: startIndex,
      },
    }),
    enabled: !!libraryId && !!currentUser?.Id,
  });

  // Update items when new page data arrives
  const handleNewPageData = useCallback(() => {
    if (pageData?.Items) {
      if (startIndex === 0) {
        setAllItems(pageData.Items);
      } else {
        setAllItems((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((item) => item.Id));
          const newItems = pageData.Items!.filter(
            (item) => !existingIds.has(item.Id)
          );
          return [...prev, ...newItems];
        });
      }
      if (pageData.TotalRecordCount !== undefined) {
        setTotalCount(pageData.TotalRecordCount);
      }
    }
  }, [pageData, startIndex]);

  // Effect to handle new data
  useMemo(() => {
    handleNewPageData();
  }, [handleNewPageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setStartIndex(0);
    setAllItems([]);
    await refetchPage();
    setRefreshing(false);
  }, [refetchPage]);

  const onEndReached = useCallback(() => {
    if (isFetching) return;
    if (totalCount !== null && allItems.length >= totalCount) return;

    const nextIndex = allItems.length;
    if (nextIndex !== startIndex) {
      setStartIndex(nextIndex);
    }
  }, [isFetching, totalCount, allItems.length, startIndex]);

  const renderItem = useCallback(
    ({ item }: { item: BaseItemDto }) => (
      <View style={[styles.cardWrapper, { width: cardWidth }]}>
        <PosterCard item={item} width={cardWidth} showProgress={true} />
      </View>
    ),
    [cardWidth]
  );

  const keyExtractor = useCallback((item: BaseItemDto) => item.Id ?? '', []);

  const libraryName = libraryInfo?.Name ?? 'Library';

  const ListFooterComponent = useCallback(() => {
    if (isFetching && allItems.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.text.secondary} />
        </View>
      );
    }
    return null;
  }, [isFetching, allItems.length, colors.text.secondary]);

  if (isLoadingPage && allItems.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={colors.interactive.primary}
            />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            {libraryName}
          </ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text.secondary} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={colors.interactive.primary}
            />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            {libraryName}
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={{ color: colors.text.secondary }}>
            Failed to load items
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.background.primary },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.interactive.primary}
          />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
          {libraryName}
        </ThemedText>
        {totalCount !== null && (
          <ThemedText style={[styles.itemCount, { color: colors.text.tertiary }]}>
            {totalCount} items
          </ThemedText>
        )}
      </View>

      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={`grid-${numColumns}`} // Force re-render when columns change
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        columnWrapperStyle={[styles.row, { gap: CARD_GAP }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text.secondary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="film"
              size={48}
              color={colors.text.tertiary}
            />
            <ThemedText style={[styles.emptyText, { color: colors.text.secondary }]}>
              No items in this library
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
  },
  itemCount: {
    fontSize: 14,
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
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    marginBottom: spacing.md,
  },
  cardWrapper: {
    // Width is set dynamically
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
