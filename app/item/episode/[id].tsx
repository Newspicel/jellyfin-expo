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
const BACKDROP_HEIGHT = 240;

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

function formatAirDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface AdjacentEpisodeCardProps {
  episode: BaseItemDto;
  direction: 'previous' | 'next';
  onPress: () => void;
}

function AdjacentEpisodeCard({ episode, direction, onPress }: AdjacentEpisodeCardProps) {
  const colors = useColors();
  const thumbnailUrl = getBackdropImageUrl(episode, 200);

  return (
    <Pressable
      style={[styles.adjacentCard, { backgroundColor: colors.background.secondary }]}
      onPress={onPress}
    >
      <View style={styles.adjacentContent}>
        <IconSymbol
          name={direction === 'previous' ? 'chevron.left' : 'chevron.right'}
          size={16}
          color={colors.text.tertiary}
        />
        <View style={styles.adjacentInfo}>
          <ThemedText style={[styles.adjacentLabel, { color: colors.text.secondary }]}>
            {direction === 'previous' ? 'Previous' : 'Next'}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.adjacentTitle}>
            {episode.IndexNumber}. {episode.Name}
          </ThemedText>
        </View>
      </View>
      {thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.adjacentThumbnail}
          contentFit="cover"
          transition={200}
        />
      )}
    </Pressable>
  );
}

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch episode details
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

  // Fetch adjacent episodes (previous and next)
  const { data: adjacentEpisodes } = useQuery({
    ...getEpisodesOptions({
      path: { seriesId: item?.SeriesId ?? '' },
      query: {
        seasonId: item?.SeasonId ?? undefined,
        adjacentTo: id!,
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

  const handlePlay = useCallback(() => {
    if (!id) return;
    router.push(`/(player)/${id}`);
  }, [id, router]);

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

  const handleSeriesPress = useCallback(() => {
    if (item?.SeriesId) {
      router.push(`/item/series/${item.SeriesId}`);
    }
  }, [item?.SeriesId, router]);

  const handleSeasonPress = useCallback(() => {
    if (item?.SeasonId) {
      router.push(`/item/season/${item.SeasonId}`);
    }
  }, [item?.SeasonId, router]);

  const handleEpisodePress = useCallback(
    (episodeId: string) => {
      router.replace(`/item/episode/${episodeId}`);
    },
    [router]
  );

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
          <ThemedText>Episode not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Get backdrop URL - prefer episode, fall back to series
  const episodeBackdropUrl = getBackdropImageUrl(item, SCREEN_WIDTH * 2);
  const seriesBackdropUrl = item.SeriesId
    ? getBackdropImageUrl({ Id: item.SeriesId, BackdropImageTags: item.ParentBackdropImageTags }, SCREEN_WIDTH * 2)
    : null;
  const backdropUrl = episodeBackdropUrl || seriesBackdropUrl || getPrimaryImageUrl(item, SCREEN_WIDTH * 2);

  const isWatched = item.UserData?.Played ?? false;
  const isFavorite = item.UserData?.IsFavorite ?? false;
  const progress = item.UserData?.PlayedPercentage ?? 0;

  // Find previous and next episodes from adjacent data
  const episodes = adjacentEpisodes?.Items ?? [];
  const currentIndex = episodes.findIndex((e) => e.Id === id);
  const previousEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  // Episode identifier string
  const episodeIdentifier = `S${item.ParentIndexNumber ?? '?'} E${item.IndexNumber ?? '?'}`;

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
            <View style={[styles.backdrop, { backgroundColor: colors.background.tertiary }]}>
              <IconSymbol name="play.tv" size={48} color={colors.text.tertiary} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', colors.background.primary]}
            locations={[0, 0.5, 1]}
            style={styles.gradient}
          />

          {/* Progress bar on backdrop */}
          {progress > 0 && !isWatched && (
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.interactive.primary }]}
              />
            </View>
          )}

          {/* Play button overlay */}
          <View style={styles.playOverlay}>
            <Pressable
              style={[styles.playButtonLarge, { backgroundColor: colors.interactive.primary }]}
              onPress={handlePlay}
            >
              <IconSymbol name="play.fill" size={32} color="#fff" />
            </Pressable>
          </View>

          {/* Runtime badge */}
          {item.RunTimeTicks && (
            <View style={[styles.runtimeBadge, { backgroundColor: colors.overlay.dark }]}>
              <ThemedText style={styles.runtimeText}>
                {formatRuntime(item.RunTimeTicks)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Series/Season breadcrumb */}
          <View style={styles.breadcrumb}>
            {item.SeriesName && (
              <Pressable onPress={handleSeriesPress}>
                <ThemedText style={[styles.breadcrumbText, { color: colors.interactive.primary }]}>
                  {item.SeriesName}
                </ThemedText>
              </Pressable>
            )}
            {item.SeasonName && (
              <>
                <ThemedText style={[styles.breadcrumbSeparator, { color: colors.text.tertiary }]}>
                  /
                </ThemedText>
                <Pressable onPress={handleSeasonPress}>
                  <ThemedText style={[styles.breadcrumbText, { color: colors.interactive.primary }]}>
                    {item.SeasonName}
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>

          {/* Episode identifier */}
          <ThemedText style={[styles.episodeIdentifier, { color: colors.text.secondary }]}>
            {episodeIdentifier}
          </ThemedText>

          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            {item.Name}
          </ThemedText>

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            {item.PremiereDate && (
              <ThemedText style={[styles.metaText, { color: colors.text.secondary }]}>
                {formatAirDate(item.PremiereDate)}
              </ThemedText>
            )}
            {item.CommunityRating && (
              <>
                <ThemedText style={[styles.metaDot, { color: colors.text.tertiary }]}>
                  •
                </ThemedText>
                <View style={styles.rating}>
                  <IconSymbol name="star.fill" size={14} color={colors.media.rating} />
                  <ThemedText style={[styles.ratingText, { color: colors.text.secondary }]}>
                    {item.CommunityRating.toFixed(1)}
                  </ThemedText>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.playButton, { backgroundColor: colors.interactive.primary }]}
              onPress={handlePlay}
            >
              <IconSymbol name="play.fill" size={22} color="#fff" />
              <ThemedText style={styles.playButtonText}>
                {progress > 0 && !isWatched ? 'Resume' : 'Play'}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleToggleWatched}
            >
              <IconSymbol
                name={isWatched ? 'checkmark.circle.fill' : 'checkmark.circle'}
                size={22}
                color={isWatched ? colors.media.watched : colors.text.secondary}
              />
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
            </Pressable>
          </View>

          {/* Overview */}
          {item.Overview && (
            <ThemedText style={[styles.overview, { color: colors.text.primary }]}>
              {formatOverview(item.Overview)}
            </ThemedText>
          )}

          {/* Adjacent Episodes */}
          {(previousEpisode || nextEpisode) && (
            <View style={styles.adjacentSection}>
              {previousEpisode && previousEpisode.Id && (
                <AdjacentEpisodeCard
                  episode={previousEpisode}
                  direction="previous"
                  onPress={() => handleEpisodePress(previousEpisode.Id!)}
                />
              )}
              {nextEpisode && nextEpisode.Id && (
                <AdjacentEpisodeCard
                  episode={nextEpisode}
                  direction="next"
                  onPress={() => handleEpisodePress(nextEpisode.Id!)}
                />
              )}
            </View>
          )}

          {/* Media Info */}
          {item.MediaStreams && item.MediaStreams.length > 0 && (
            <View style={styles.mediaInfoSection}>
              <ThemedText type="subtitle" style={styles.mediaInfoTitle}>
                Media Info
              </ThemedText>
              <View style={[styles.mediaInfoCard, { backgroundColor: colors.background.secondary }]}>
                {(() => {
                  const videoStream = item.MediaStreams?.find((s) => s.Type === 'Video');
                  const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio') ?? [];

                  return (
                    <>
                      {videoStream?.DisplayTitle && (
                        <View style={styles.mediaInfoRow}>
                          <ThemedText style={[styles.mediaInfoLabel, { color: colors.text.secondary }]}>
                            Video
                          </ThemedText>
                          <ThemedText style={styles.mediaInfoValue} numberOfLines={1}>
                            {videoStream.DisplayTitle}
                          </ThemedText>
                        </View>
                      )}
                      {videoStream?.Width && videoStream?.Height && (
                        <View style={styles.mediaInfoRow}>
                          <ThemedText style={[styles.mediaInfoLabel, { color: colors.text.secondary }]}>
                            Resolution
                          </ThemedText>
                          <ThemedText style={styles.mediaInfoValue}>
                            {videoStream.Width}x{videoStream.Height}
                          </ThemedText>
                        </View>
                      )}
                      {audioStreams.length > 0 && audioStreams[0].DisplayTitle && (
                        <View style={styles.mediaInfoRow}>
                          <ThemedText style={[styles.mediaInfoLabel, { color: colors.text.secondary }]}>
                            Audio
                          </ThemedText>
                          <ThemedText style={styles.mediaInfoValue} numberOfLines={1}>
                            {audioStreams[0].DisplayTitle}
                          </ThemedText>
                        </View>
                      )}
                      {item.Container && (
                        <View style={styles.mediaInfoRow}>
                          <ThemedText style={[styles.mediaInfoLabel, { color: colors.text.secondary }]}>
                            Container
                          </ThemedText>
                          <ThemedText style={styles.mediaInfoValue}>
                            {item.Container.toUpperCase()}
                          </ThemedText>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            </View>
          )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BACKDROP_HEIGHT,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  runtimeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  runtimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
  },
  episodeIdentifier: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 14,
  },
  metaDot: {
    fontSize: 14,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  adjacentSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  adjacentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  adjacentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adjacentInfo: {
    flex: 1,
  },
  adjacentLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adjacentTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  adjacentThumbnail: {
    width: 80,
    height: 45,
    borderRadius: radii.xs,
    marginLeft: spacing.sm,
  },
  mediaInfoSection: {
    marginTop: spacing.xl,
  },
  mediaInfoTitle: {
    marginBottom: spacing.sm,
  },
  mediaInfoCard: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  mediaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  mediaInfoLabel: {
    fontSize: 14,
    flex: 1,
  },
  mediaInfoValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
});
