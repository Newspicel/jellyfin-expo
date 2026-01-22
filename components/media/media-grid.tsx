import { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { BaseItemDto } from '@/api/generated';
import { PosterCard } from './poster-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui';
import { useColors, spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MediaGridProps {
  /** Array of media items to display */
  items: BaseItemDto[];
  /** Whether the grid is loading */
  isLoading?: boolean;
  /** Whether more items are being fetched */
  isFetchingMore?: boolean;
  /** Whether the list is being refreshed */
  isRefreshing?: boolean;
  /** Called when pull-to-refresh is triggered */
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
  /** Additional top padding (e.g., for floating headers) */
  paddingTop?: number;
  /** Additional bottom padding */
  paddingBottom?: number;
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
  isRefreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  minCardWidth = 100,
  maxCardWidth = 140,
  cardGap = spacing.sm,
  horizontalPadding = spacing.md * 2,
  minColumns = 3,
  maxColumns = 6,
  showProgress = true,
  emptyMessage = 'No items found',
  emptyIcon = 'film',
  contentContainerStyle,
  ListHeaderComponent,
  paddingTop = 0,
  paddingBottom = 0,
}: MediaGridProps) {
  const colors = useColors();

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
    ({ item }: { item: BaseItemDto }) => (
      <View style={[styles.cardWrapper, { width: cardWidth, paddingHorizontal: cardGap / 2, paddingBottom: cardGap }]}>
        <PosterCard item={item} width={cardWidth - cardGap} showProgress={showProgress} />
      </View>
    ),
    [cardWidth, cardGap, showProgress]
  );

  const keyExtractor = useCallback((item: BaseItemDto) => item.Id ?? '', []);

  const ListFooterComponent = useCallback(() => {
    if (isFetchingMore && items.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.text.secondary} />
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
        <IconSymbol name={emptyIcon as any} size={48} color={colors.text.tertiary} />
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
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={[
        styles.listContent,
        { paddingHorizontal: (horizontalPadding - cardGap) / 2, paddingTop, paddingBottom },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.text.secondary}
            progressViewOffset={paddingTop}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
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
    paddingTop: spacing.sm,
  },
  cardWrapper: {
    // Width, padding are set dynamically
  },
  footerLoader: {
    paddingVertical: spacing.lg,
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
});
