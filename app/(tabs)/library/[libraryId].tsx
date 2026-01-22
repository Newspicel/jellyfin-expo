import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from '@/components/media/poster-card';
import { IconSymbol, BackButton, SortSelector, DEFAULT_SORT_OPTIONS, FilterSelector } from '@/components/ui';
import type { SortOption, FilterState } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import {
  getItemsOptions,
  getItemOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto, BaseItemKind } from '@/api/generated';
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
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [sortSelectorVisible, setSortSelectorVisible] = useState(false);
  const [filterSelectorVisible, setFilterSelectorVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>(DEFAULT_SORT_OPTIONS[0]);
  const [activeFilters, setActiveFilters] = useState<FilterState>({ genres: [], years: [] });

  const { numColumns, cardWidth } = useMemo(() => calculateGridLayout(), []);

  // Fetch the library info to get the name and collection type
  const { data: libraryInfo } = useQuery({
    ...getItemOptions({
      path: { itemId: libraryId! },
    }),
    enabled: !!libraryId && !!currentUser?.Id,
  });

  // Determine includeItemTypes based on library collection type
  const includeItemTypes = useMemo((): BaseItemKind[] | undefined => {
    switch (libraryInfo?.CollectionType) {
      case 'movies':
        return ['Movie'];
      case 'tvshows':
        return ['Series'];
      case 'music':
        return ['MusicAlbum'];
      case 'boxsets':
        return ['BoxSet'];
      default:
        return undefined; // Don't filter, show all direct children
    }
  }, [libraryInfo?.CollectionType]);

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
        userId: currentUser?.Id,
        parentId: libraryId,
        sortBy: [currentSort.sortBy],
        sortOrder: [currentSort.sortOrder],
        recursive: false,
        includeItemTypes: includeItemTypes,
        fields: ['PrimaryImageAspectRatio'],
        enableImages: true,
        enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
        imageTypeLimit: 1,
        limit: PAGE_SIZE,
        startIndex: startIndex,
        // Apply filters
        genres: activeFilters.genres.length > 0 ? activeFilters.genres : undefined,
        years: activeFilters.years.length > 0 ? activeFilters.years : undefined,
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

  const onSortChange = useCallback((option: SortOption) => {
    setCurrentSort(option);
    setStartIndex(0);
    setAllItems([]);
  }, []);

  const onFilterChange = useCallback((filters: FilterState) => {
    setActiveFilters(filters);
    setStartIndex(0);
    setAllItems([]);
  }, []);

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

  // Calculate header height for content inset
  const headerHeight = insets.top + 52;

  const activeFilterCount = activeFilters.genres.length + activeFilters.years.length;

  // Render the header with floating glass back button, centered title, filter and sort buttons
  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top + spacing.sm }]}>
      <BackButton variant="inline" />
      <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
        {libraryName}
      </ThemedText>
      <View style={styles.headerButtons}>
        <Pressable
          style={[
            styles.headerButton,
            { backgroundColor: colors.background.tertiary },
            activeFilterCount > 0 && { backgroundColor: colors.interactive.primary },
          ]}
          onPress={() => setFilterSelectorVisible(true)}
        >
          <IconSymbol
            name="line.3.horizontal.decrease"
            size={18}
            color={activeFilterCount > 0 ? colors.text.inverse : colors.text.primary}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.text.inverse }]}>
              <ThemedText style={[styles.filterBadgeText, { color: colors.interactive.primary }]}>
                {activeFilterCount}
              </ThemedText>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.headerButton, { backgroundColor: colors.background.tertiary }]}
          onPress={() => setSortSelectorVisible(true)}
        >
          <IconSymbol name="arrow.up.arrow.down" size={18} color={colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );

  if (isLoadingPage && allItems.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
          <ActivityIndicator size="large" color={colors.text.secondary} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={[styles.errorContainer, { paddingTop: headerHeight }]}>
          <ThemedText style={{ color: colors.text.secondary }}>
            Failed to load items
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={`grid-${numColumns}`} // Force re-render when columns change
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + spacing.sm, paddingBottom: insets.bottom + 16 },
        ]}
        columnWrapperStyle={[styles.row, { gap: CARD_GAP }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text.secondary}
            progressViewOffset={headerHeight}
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
      {renderHeader()}
      <SortSelector
        visible={sortSelectorVisible}
        options={DEFAULT_SORT_OPTIONS}
        selectedId={currentSort.id}
        onSelect={onSortChange}
        onClose={() => setSortSelectorVisible(false)}
      />
      <FilterSelector
        visible={filterSelectorVisible}
        parentId={libraryId!}
        includeItemTypes={includeItemTypes}
        activeFilters={activeFilters}
        onApply={onFilterChange}
        onClose={() => setFilterSelectorVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
