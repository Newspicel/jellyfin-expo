import { useCallback, useMemo, useRef } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { GlassView, GlassContainer } from '@/components/themed/GlassView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSearchStore } from '@/stores/search.store';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';
import { useColors, spacing, radii } from '@/theme';
import { getSearchHintsOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { SearchHint, BaseItemKind } from '@/api/generated';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type SearchFilter = 'all' | 'movies' | 'series' | 'episodes' | 'people';

const FILTER_CONFIG: Record<SearchFilter, { label: string; icon: string; types?: BaseItemKind[] }> = {
  all: { label: 'All', icon: 'sparkles' },
  movies: { label: 'Movies', icon: 'film.fill', types: ['Movie'] },
  series: { label: 'Series', icon: 'tv.fill', types: ['Series'] },
  episodes: { label: 'Episodes', icon: 'play.rectangle.fill', types: ['Episode'] },
  people: { label: 'People', icon: 'person.fill', types: ['Person'] },
};

// Sort order priority - lower number = higher priority (shows first)
const TYPE_PRIORITY: Record<string, number> = {
  Movie: 1,
  Series: 2,
  Person: 3,
  MusicAlbum: 4,
  MusicArtist: 5,
  Episode: 10, // Episodes at the bottom
};

function getImageUrl(item: SearchHint, serverUrl: string, maxWidth = 150): string | null {
  if (!item.Id) return null;

  // For episodes, try thumb image first (usually episode screenshot)
  if (item.Type === 'Episode') {
    // Use thumb if available
    if (item.ThumbImageTag && item.ThumbImageItemId) {
      const params = new URLSearchParams({
        tag: item.ThumbImageTag,
        maxWidth: maxWidth.toString(),
        quality: '90',
      });
      return `${serverUrl}/Items/${item.ThumbImageItemId}/Images/Thumb?${params.toString()}`;
    }
    // Fall back to primary if available
    if (item.PrimaryImageTag) {
      const params = new URLSearchParams({
        tag: item.PrimaryImageTag,
        maxWidth: maxWidth.toString(),
        quality: '90',
      });
      return `${serverUrl}/Items/${item.Id}/Images/Primary?${params.toString()}`;
    }
    // No image available for episode
    return null;
  }

  // For other types, use primary image
  if (!item.PrimaryImageTag) return null;

  const params = new URLSearchParams({
    tag: item.PrimaryImageTag,
    maxWidth: maxWidth.toString(),
    quality: '90',
  });

  return `${serverUrl}/Items/${item.Id}/Images/Primary?${params.toString()}`;
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const searchBarRef = useRef<SearchBarCommands | null>(null);

  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const activeFilter = useSearchStore((s) => s.activeFilter ?? 'all') as SearchFilter;
  const setActiveFilter = useSearchStore((s) => s.setActiveFilter);

  const currentUser = useAuthStore((s) => s.currentUser);
  const serverUrl = useServerStore((s) => s.getCurrentServer()?.url);

  // Debounce the search query
  const debouncedQuery = useDebouncedValue(query, 300);

  // Set up native search bar
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerSearchBarOptions: {
          ref: searchBarRef as React.RefObject<SearchBarCommands>,
          placeholder: 'Movies, shows, people...',
          hideWhenScrolling: false,
          hideNavigationBar: false,
          onChangeText: (e: { nativeEvent: { text: string } }) => {
            setQuery(e.nativeEvent.text);
          },
          onSearchButtonPress: () => {
            Keyboard.dismiss();
            searchBarRef.current?.blur();
          },
        },
      });

      // Focus search bar when screen comes into focus
      const timer = setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }, [navigation, setQuery])
  );

  // Build search options based on filter
  const searchOptions = useMemo(() => {
    const filterConfig = FILTER_CONFIG[activeFilter];
    return {
      query: {
        searchTerm: debouncedQuery,
        limit: 50,
        userId: currentUser?.Id,
        includeItemTypes: filterConfig.types,
        includePeople: activeFilter === 'all' || activeFilter === 'people',
        includeMedia: activeFilter !== 'people',
      },
    };
  }, [debouncedQuery, activeFilter, currentUser?.Id]);

  // Fetch search results
  const { data: searchResults, isLoading, isFetching } = useQuery({
    ...getSearchHintsOptions(searchOptions),
    enabled: debouncedQuery.length >= 2,
  });

  // Sort results: movies/series first, episodes last
  const sortedResults = useMemo(() => {
    if (!searchResults?.SearchHints) return [];

    return [...searchResults.SearchHints].sort((a, b) => {
      const priorityA = TYPE_PRIORITY[a.Type ?? ''] ?? 5;
      const priorityB = TYPE_PRIORITY[b.Type ?? ''] ?? 5;
      return priorityA - priorityB;
    });
  }, [searchResults?.SearchHints]);

  const handleResultPress = useCallback((item: SearchHint) => {
    Keyboard.dismiss();
    searchBarRef.current?.blur();
    if (!item.Id) return;

    switch (item.Type) {
      case 'Movie':
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'Series':
        router.push(`/item/series/${item.Id}`);
        break;
      case 'Episode':
        router.push(`/item/episode/${item.Id}`);
        break;
      case 'Season':
        router.push(`/item/season/${item.Id}`);
        break;
      case 'Person':
        // TODO: Implement person detail view
        break;
      default:
        router.push(`/item/movie/${item.Id}`);
    }
  }, [router]);

  const handleFilterChange = useCallback((filter: SearchFilter) => {
    setActiveFilter(filter);
  }, [setActiveFilter]);

  const renderResultItem = (item: SearchHint) => {
    const imageUrl = serverUrl ? getImageUrl(item, serverUrl, 150) : null;
    const isPerson = item.Type === 'Person';
    const subtitle = getSubtitle(item);

    return (
      <Pressable
        key={item.Id}
        style={styles.resultItem}
        onPress={() => handleResultPress(item)}
      >
        <View
          style={[
            styles.resultImage,
            isPerson && styles.resultImagePerson,
            { backgroundColor: colors.background.tertiary },
          ]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, isPerson && styles.imagePerson]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <IconSymbol
              name={isPerson ? 'person.fill' : 'photo'}
              size={24}
              color={colors.text.tertiary}
            />
          )}
        </View>
        <View style={styles.resultInfo}>
          <ThemedText numberOfLines={1} style={styles.resultTitle}>
            {item.Name}
          </ThemedText>
          {subtitle && (
            <ThemedText
              numberOfLines={1}
              style={[styles.resultSubtitle, { color: colors.text.secondary }]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
      </Pressable>
    );
  };

  const showEmptyState = debouncedQuery.length >= 2 && !isLoading && sortedResults.length === 0;
  const showInitialState = debouncedQuery.length < 2;
  const isSearching = isFetching && debouncedQuery.length >= 2;

  return (
    <ThemedView style={styles.container}>
      {/* Results with Filter Bar at top */}
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Liquid Glass Filter Bar */}
        <View style={styles.filterBarContainer}>
          <GlassContainer spacing={0}>
            <GlassView glassStyle="regular" borderRadius="full" style={styles.filterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
              >
                {(Object.keys(FILTER_CONFIG) as SearchFilter[]).map((filter) => {
                  const config = FILTER_CONFIG[filter];
                  const isActive = activeFilter === filter;

                  return (
                    <Pressable
                      key={filter}
                      style={[
                        styles.filterChip,
                        isActive && { backgroundColor: colors.interactive.primary },
                      ]}
                      onPress={() => handleFilterChange(filter)}
                    >
                      <IconSymbol
                        name={config.icon as any}
                        size={14}
                        color={isActive ? '#fff' : colors.text.secondary}
                      />
                      <ThemedText
                        style={[
                          styles.filterChipText,
                          { color: isActive ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {config.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
                {isSearching && (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={colors.text.secondary} />
                  </View>
                )}
              </ScrollView>
            </GlassView>
          </GlassContainer>
        </View>

        {showInitialState && (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color={colors.text.tertiary} />
            <ThemedText style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              Start typing to search
            </ThemedText>
          </View>
        )}

        {showEmptyState && (
          <View style={styles.emptyState}>
            <IconSymbol name="questionmark.circle" size={48} color={colors.text.tertiary} />
            <ThemedText style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No results found
            </ThemedText>
          </View>
        )}

        {sortedResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {sortedResults.map(renderResultItem)}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function getSubtitle(item: SearchHint): string | null {
  switch (item.Type) {
    case 'Episode':
      return item.Series
        ? `${item.Series} • S${item.ParentIndexNumber}:E${item.IndexNumber}`
        : null;
    case 'Movie':
    case 'Series':
      return item.ProductionYear?.toString() ?? null;
    case 'Person':
      return 'Person';
    case 'MusicAlbum':
      return item.AlbumArtist ?? null;
    case 'Audio':
      return item.Album ?? item.Artists?.join(', ') ?? null;
    default:
      return item.Type ?? null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterBar: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingIndicator: {
    paddingHorizontal: spacing.sm,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  resultsContainer: {
    gap: spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.md,
  },
  resultImage: {
    width: 60,
    height: 90,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resultImagePerson: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePerson: {
    borderRadius: radii.full,
  },
  resultInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'] * 2,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
