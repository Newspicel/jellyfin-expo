import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol, BackButton } from '@/components/ui';
import {
  getItemOptions,
  getEpisodesOptions,
  markPlayedItemMutation,
  markUnplayedItemMutation,
  markFavoriteItemMutation,
  unmarkFavoriteItemMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';
import { getBackdropImageUrl, getPrimaryImageUrl } from '@/lib/images';
import { useColors, spacing, radii } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = 300;
const EPISODE_THUMBNAIL_WIDTH = 140;
const EPISODE_THUMBNAIL_HEIGHT = 80;

function formatRuntime(ticks: number | null | undefined): string {
  if (!ticks) return '';
  const minutes = Math.round(ticks / 600000000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatOverview(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/<\/?br\s*\/?>/gi, '\n');
}

interface EpisodeCardProps {
  episode: BaseItemDto;
  episodeNumber: number;
  onPress: () => void;
}

function EpisodeCard({ episode, episodeNumber, onPress }: EpisodeCardProps) {
  const colors = useColors();
  const thumbnailUrl = getBackdropImageUrl(episode, EPISODE_THUMBNAIL_WIDTH * 2);
  const progress = episode.UserData?.PlayedPercentage ?? 0;
  const isWatched = episode.UserData?.Played ?? false;

  // Check if episode name is just "Episode X" - if so, don't show it redundantly
  const episodeName = episode.Name ?? '';
  const isGenericName = /^Episode\s*\d+$/i.test(episodeName);
  const displayName = isGenericName ? null : episodeName;

  return (
    <Pressable
      style={styles.episodeCard}
      onPress={onPress}
    >
      {/* Thumbnail */}
      <View style={styles.episodeThumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={[styles.episodeThumbnail, { backgroundColor: colors.background.tertiary }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.episodeThumbnail, { backgroundColor: colors.background.tertiary }]}>
            <IconSymbol name="tv" size={24} color={colors.text.tertiary} />
          </View>
        )}

        {/* Progress bar */}
        {progress > 0 && !isWatched && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.interactive.primary }]}
            />
          </View>
        )}

        {/* Watched indicator */}
        {isWatched && (
          <View style={[styles.watchedBadge, { backgroundColor: colors.media.watched }]}>
            <IconSymbol name="checkmark" size={10} color="#fff" />
          </View>
        )}

        {/* Runtime badge */}
        {episode.RunTimeTicks && (
          <View style={[styles.runtimeBadge, { backgroundColor: colors.overlay.dark }]}>
            <ThemedText style={styles.runtimeText}>
              {formatRuntime(episode.RunTimeTicks)}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Episode info */}
      <View style={styles.episodeInfo}>
        <ThemedText style={[styles.episodeNumber, { color: colors.text.secondary }]}>
          {episodeNumber}
        </ThemedText>
        <View style={styles.episodeTextContent}>
          {displayName && (
            <ThemedText numberOfLines={1} style={styles.episodeTitle}>
              {displayName}
            </ThemedText>
          )}
          {episode.Overview && (
            <ThemedText
              numberOfLines={displayName ? 2 : 3}
              style={[styles.episodeOverview, { color: colors.text.secondary }]}
            >
              {formatOverview(episode.Overview)}
            </ThemedText>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
      </View>
    </Pressable>
  );
}

export default function SeasonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch season details
  const {
    data: item,
    isLoading,
    refetch,
  } = useQuery({
    ...getItemOptions({
      path: { itemId: id! },
    }),
    enabled: !!id,
  });

  // Fetch episodes for this season
  const { data: episodesData, isLoading: isLoadingEpisodes } = useQuery({
    ...getEpisodesOptions({
      path: { seriesId: item?.SeriesId ?? '' },
      query: {
        seasonId: id!,
        fields: ['Overview', 'PrimaryImageAspectRatio'],
      },
    }),
    enabled: !!id && !!item?.SeriesId,
  });

  // Mutations
  const markPlayedMutation = useMutation({
    ...markPlayedItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
      queryClient.invalidateQueries({ queryKey: ['getEpisodes'] });
    },
  });

  const markUnplayedMutation = useMutation({
    ...markUnplayedItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
      queryClient.invalidateQueries({ queryKey: ['getEpisodes'] });
    },
  });

  const markFavoriteMutation = useMutation({
    ...markFavoriteItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
    },
  });

  const unmarkFavoriteMutation = useMutation({
    ...unmarkFavoriteItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleToggleWatched = useCallback(() => {
    if (!id) return;
    if (item?.UserData?.Played) {
      markUnplayedMutation.mutate({
        path: { itemId: id },
      });
    } else {
      markPlayedMutation.mutate({
        path: { itemId: id },
      });
    }
  }, [id, item?.UserData?.Played, markPlayedMutation, markUnplayedMutation]);

  const handleToggleFavorite = useCallback(() => {
    if (!id) return;
    if (item?.UserData?.IsFavorite) {
      unmarkFavoriteMutation.mutate({
        path: { itemId: id },
      });
    } else {
      markFavoriteMutation.mutate({
        path: { itemId: id },
      });
    }
  }, [id, item?.UserData?.IsFavorite, markFavoriteMutation, unmarkFavoriteMutation]);

  const handleEpisodePress = useCallback(
    (episodeId: string) => {
      router.push(`/item/episode/${episodeId}`);
    },
    [router]
  );

  const handleSeriesPress = useCallback(() => {
    if (item?.SeriesId) {
      router.push(`/item/series/${item.SeriesId}`);
    }
  }, [item?.SeriesId, router]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ThemedText>Season not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Try to get series backdrop, fall back to season image
  const seriesBackdropUrl = item.SeriesId
    ? getBackdropImageUrl({ Id: item.SeriesId, BackdropImageTags: item.ParentBackdropImageTags }, SCREEN_WIDTH * 2)
    : null;
  const backdropUrl = seriesBackdropUrl || getBackdropImageUrl(item, SCREEN_WIDTH * 2) || getPrimaryImageUrl(item, SCREEN_WIDTH * 2);

  const isWatched = item.UserData?.Played ?? false;
  const isFavorite = item.UserData?.IsFavorite ?? false;
  const episodes = episodesData?.Items ?? [];
  const episodeCount = episodes.length;
  const watchedCount = episodes.filter((e) => e.UserData?.Played).length;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Back Button */}
      <BackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Backdrop */}
        <View style={styles.heroContainer}>
          {backdropUrl ? (
            <Image
              source={{ uri: backdropUrl }}
              style={styles.backdrop}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: colors.background.tertiary }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', colors.background.primary]}
            locations={[0, 0.5, 1]}
            style={styles.gradient}
          />

          {/* Title overlay on backdrop */}
          <View style={[styles.heroContent, { paddingBottom: spacing.lg }]}>
            {item.SeriesName && (
              <Pressable onPress={handleSeriesPress}>
                <ThemedText style={styles.seriesNameHero} numberOfLines={1}>
                  {item.SeriesName}
                </ThemedText>
              </Pressable>
            )}
            <ThemedText style={styles.seasonTitleHero}>
              {item.Name}
            </ThemedText>
            <View style={styles.metaRowHero}>
              {item.ProductionYear && (
                <ThemedText style={styles.metaTextHero}>
                  {item.ProductionYear}
                </ThemedText>
              )}
              <ThemedText style={styles.metaTextHero}>
                {episodeCount} Episode{episodeCount !== 1 ? 's' : ''}
              </ThemedText>
              {watchedCount > 0 && watchedCount < episodeCount && (
                <ThemedText style={styles.metaTextHero}>
                  {watchedCount} watched
                </ThemedText>
              )}
              {watchedCount === episodeCount && episodeCount > 0 && (
                <View style={styles.allWatchedBadge}>
                  <IconSymbol name="checkmark" size={10} color="#fff" />
                  <ThemedText style={styles.allWatchedText}>Complete</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleToggleWatched}
            >
              <IconSymbol
                name={isWatched ? 'checkmark.circle.fill' : 'checkmark.circle'}
                size={22}
                color={isWatched ? colors.media.watched : colors.text.secondary}
              />
              <ThemedText style={[styles.actionButtonText, { color: isWatched ? colors.media.watched : colors.text.secondary }]}>
                {isWatched ? 'Watched' : 'Mark Watched'}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleToggleFavorite}
            >
              <IconSymbol
                name={isFavorite ? 'heart.fill' : 'heart'}
                size={22}
                color={isFavorite ? colors.media.favorite : colors.text.secondary}
              />
              <ThemedText style={[styles.actionButtonText, { color: isFavorite ? colors.media.favorite : colors.text.secondary }]}>
                {isFavorite ? 'Favorited' : 'Favorite'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Overview */}
          {item.Overview && (
            <ThemedText style={[styles.overview, { color: colors.text.secondary }]}>
              {formatOverview(item.Overview)}
            </ThemedText>
          )}

          {/* Episodes Section */}
          <View style={styles.episodesSection}>
            <ThemedText type="subtitle" style={styles.episodesTitle}>
              Episodes
            </ThemedText>

            {isLoadingEpisodes ? (
              <View style={styles.episodesLoading}>
                <ActivityIndicator size="small" />
              </View>
            ) : episodes.length === 0 ? (
              <ThemedText style={[styles.noEpisodes, { color: colors.text.secondary }]}>
                No episodes found
              </ThemedText>
            ) : (
              <View style={styles.episodesList}>
                {episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.Id}
                    episode={episode}
                    episodeNumber={episode.IndexNumber ?? 0}
                    onPress={() => episode.Id && handleEpisodePress(episode.Id)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BACKDROP_HEIGHT,
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
  },
  seriesNameHero: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  seasonTitleHero: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  metaRowHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaTextHero: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  allWatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  allWatchedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  episodesSection: {
    marginTop: spacing.xl,
  },
  episodesTitle: {
    marginBottom: spacing.md,
  },
  episodesLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noEpisodes: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  episodesList: {
    gap: spacing.xs,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  episodeThumbnailContainer: {
    width: EPISODE_THUMBNAIL_WIDTH,
    height: EPISODE_THUMBNAIL_HEIGHT,
    borderRadius: radii.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  episodeThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    height: '100%',
  },
  watchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runtimeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  runtimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  episodeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  episodeNumber: {
    fontSize: 16,
    fontWeight: '600',
    width: 28,
  },
  episodeTextContent: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  episodeOverview: {
    fontSize: 13,
    lineHeight: 17,
  },
});
