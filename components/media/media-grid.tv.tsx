import { useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import type { BaseItemDto } from '@/api/generated';
import { PosterCard } from './poster-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui';
import { useColors, spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// TV-specific defaults for 10-foot UI
const TV_MIN_CARD_WIDTH = 160;
const TV_MAX_CARD_WIDTH = 200;
const TV_CARD_GAP = spacing.lg;
const TV_HORIZONTAL_PADDING = spacing.xl * 2;
const TV_MIN_COLUMNS = 4;
const TV_MAX_COLUMNS = 7;

interface MediaGridProps {
  /** Array of media items to display */
  items: BaseItemDto[];
  /** Whether the grid is loading */
  isLoading?: boolean;
  /** Whether more items are being fetched */
  isFetchingMore?: boolean;
  /** Whether the list is being refreshed */
  isRefreshing?: boolean;
  /** Called when pull-to-refresh is triggered (not typically used on TV) */
  onRefresh?: () => void;
  /** Called when the end of the list is reached (for infinite scroll) */
  onEndReached?: () => void;
  /** Threshold for triggering onEndReached (0-1) */
  onEndReachedThreshold?: number;
  /** Minimum card width in pixels */
  minCardWidth?: number;
  /** Maximum card width in pixels */
  maxCardWidth?: number;
  /** Gap between cards */
  cardGap?: number;
  /** Horizontal padding for the grid */
  horizontalPadding?: number;
  /** Minimum number of columns */
  minColumns?: number;
  /** Maximum number of columns */
  maxColumns?: number;
  /** Whether to show progress bars on cards */
  showProgress?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state icon */
  emptyIcon?: string;
  /** Content container style overrides */
  contentContainerStyle?: object;
  /** Header component to render above the grid */
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  /** Additional top padding */
  paddingTop?: number;
  /** Additional bottom padding */
  paddingBottom?: number;
  /** Index of the item that should receive initial focus */
  initialFocusIndex?: number;
}

interface GridLayout {
  numColumns: number;
  cardWidth: number;
}

function calculateGridLayout(
  screenWidth: number,
  horizontalPadding: number,
  cardGap: number,
  minCardWidth: number,
  maxCardWidth: number,
  minColumns: number,
  maxColumns: number
): GridLayout {
  const availableWidth = screenWidth - horizontalPadding;
  // Calculate optimal number of columns based on min card width
  let numColumns = Math.floor(availableWidth / (minCardWidth + cardGap));
  numColumns = Math.max(minColumns, Math.min(maxColumns, numColumns));
  // Calculate actual card width based on number of columns
  const cardWidth = Math.min(
    maxCardWidth,
    (availableWidth - (numColumns - 1) * cardGap) / numColumns
  );
  return { numColumns, cardWidth };
}

export function MediaGrid({
  items,
  isLoading = false,
  isFetchingMore = false,
  onEndReached,
  onEndReachedThreshold = 0.5,
  minCardWidth = TV_MIN_CARD_WIDTH,
  maxCardWidth = TV_MAX_CARD_WIDTH,
  cardGap = TV_CARD_GAP,
  horizontalPadding = TV_HORIZONTAL_PADDING,
  minColumns = TV_MIN_COLUMNS,
  maxColumns = TV_MAX_COLUMNS,
  showProgress = true,
  emptyMessage = 'No items found',
  emptyIcon = 'film',
  contentContainerStyle,
  ListHeaderComponent,
  paddingTop = 0,
  paddingBottom = 0,
  initialFocusIndex = 0,
}: MediaGridProps) {
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);

  const { numColumns, cardWidth } = useMemo(
    () =>
      calculateGridLayout(
        SCREEN_WIDTH,
        horizontalPadding,
        cardGap,
        minCardWidth,
        maxCardWidth,
        minColumns,
        maxColumns
      ),
    [horizontalPadding, cardGap, minCardWidth, maxCardWidth, minColumns, maxColumns]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: BaseItemDto; index: number }) => (
      <View style={[styles.cardWrapper, { width: cardWidth, marginRight: cardGap }]}>
        <PosterCard
          item={item}
          width={cardWidth}
          showProgress={showProgress}
          hasTVPreferredFocus={index === initialFocusIndex}
        />
      </View>
    ),
    [cardWidth, cardGap, showProgress, initialFocusIndex]
  );

  const keyExtractor = useCallback((item: BaseItemDto) => item.Id ?? '', []);

  const ListFooterComponent = useCallback(() => {
    if (isFetchingMore && items.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color={colors.text.secondary} />
        </View>
      );
    }
    return null;
  }, [isFetchingMore, items.length, colors.text.secondary]);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name={emptyIcon as any} size={64} color={colors.text.tertiary} />
        <ThemedText style={[styles.emptyText, { color: colors.text.secondary }]}>
          {emptyMessage}
        </ThemedText>
      </View>
    );
  }, [isLoading, emptyIcon, emptyMessage, colors.text.tertiary, colors.text.secondary]);

  // Show loading state
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text.secondary} />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`tv-grid-${numColumns}`} // Force re-render when columns change
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: horizontalPadding / 2, paddingTop, paddingBottom },
        contentContainerStyle,
      ]}
      columnWrapperStyle={styles.row}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
      // TV-specific optimizations
      removeClippedSubviews={true}
      initialNumToRender={numColumns * 3}
      maxToRenderPerBatch={numColumns * 2}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: spacing.lg,
  },
  row: {
    marginBottom: spacing.lg,
  },
  cardWrapper: {
    // Width is set dynamically
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    gap: spacing.lg,
  },
  emptyText: {
    fontSize: 20, // Larger for TV
  },
});
