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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MediaRow } from '@/components/media/media-row';
import {
  getItemOptions,
  getSeasonsOptions,
  getNextUpOptions,
  getSimilarShowsOptions,
  markPlayedItemMutation,
  markUnplayedItemMutation,
  markFavoriteItemMutation,
  unmarkFavoriteItemMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto, BaseItemPerson } from '@/api/generated';
import { getBackdropImageUrl, getPrimaryImageUrl, getPersonImageUrl } from '@/lib/images';
import { useColors, spacing, radii } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = 280;

function formatOverview(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/<\/?br\s*\/?>/gi, '\n');
}

function formatYearRange(item: BaseItemDto): string {
  const startYear = item.ProductionYear;
  const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : null;
  const status = item.Status;

  if (!startYear) return '';

  if (status === 'Ended' && endYear && endYear !== startYear) {
    return `${startYear}–${endYear}`;
  } else if (status === 'Continuing') {
    return `${startYear}–Present`;
  }

  return `${startYear}`;
}

function PersonCard({ person }: { person: BaseItemPerson }) {
  const colors = useColors();
  const personImageUrl = person.Id
    ? getPersonImageUrl(person.Id, person.PrimaryImageTag, 150)
    : null;

  return (
    <View style={styles.personCard}>
      <View style={[styles.personImage, { backgroundColor: colors.background.tertiary }]}>
        {personImageUrl ? (
          <Image
            source={{ uri: personImageUrl }}
            style={styles.personImageInner}
            contentFit="cover"
          />
        ) : (
          <IconSymbol name="person.fill" size={32} color={colors.text.tertiary} />
        )}
      </View>
      <ThemedText numberOfLines={1} style={styles.personName}>
        {person.Name}
      </ThemedText>
      <ThemedText numberOfLines={1} style={[styles.personRole, { color: colors.text.secondary }]}>
        {person.Role || person.Type}
      </ThemedText>
    </View>
  );
}

interface SeasonCardProps {
  season: BaseItemDto;
  onPress: () => void;
}

function SeasonCard({ season, onPress }: SeasonCardProps) {
  const colors = useColors();
  const posterUrl = getPrimaryImageUrl(season, 200);
  const episodeCount = season.ChildCount ?? 0;
  const unplayedCount = season.UserData?.UnplayedItemCount ?? episodeCount;
  const isAllWatched = unplayedCount === 0 && episodeCount > 0;

  return (
    <Pressable style={styles.seasonCard} onPress={onPress}>
      <View style={[styles.seasonPoster, { backgroundColor: colors.background.tertiary }]}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.seasonPosterImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <IconSymbol name="tv" size={32} color={colors.text.tertiary} />
        )}
        {isAllWatched && (
          <View style={[styles.watchedBadge, { backgroundColor: colors.media.watched }]}>
            <IconSymbol name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
      <ThemedText numberOfLines={1} style={styles.seasonName}>
        {season.Name}
      </ThemedText>
      <ThemedText style={[styles.seasonEpisodes, { color: colors.text.secondary }]}>
        {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
      </ThemedText>
    </Pressable>
  );
}

interface NextUpCardProps {
  episode: BaseItemDto;
  onPress: () => void;
}

function NextUpCard({ episode, onPress }: NextUpCardProps) {
  const colors = useColors();
  const backdropUrl = getBackdropImageUrl(episode, 400);
  const progress = episode.UserData?.PlayedPercentage ?? 0;

  return (
    <Pressable
      style={[styles.nextUpCard, { backgroundColor: colors.background.secondary }]}
      onPress={onPress}
    >
      <View style={styles.nextUpImageContainer}>
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            style={styles.nextUpImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.nextUpImage, { backgroundColor: colors.background.tertiary }]}>
            <IconSymbol name="play.tv" size={40} color={colors.text.tertiary} />
          </View>
        )}
        {progress > 0 && (
          <View style={styles.nextUpProgress}>
            <View style={[styles.nextUpProgressBar, { width: `${progress}%` }]} />
          </View>
        )}
        <View style={styles.nextUpPlayOverlay}>
          <View style={[styles.nextUpPlayButton, { backgroundColor: colors.interactive.primary }]}>
            <IconSymbol name="play.fill" size={20} color="#fff" />
          </View>
        </View>
      </View>
      <View style={styles.nextUpInfo}>
        <ThemedText style={[styles.nextUpLabel, { color: colors.text.secondary }]}>
          Next Up
        </ThemedText>
        <ThemedText numberOfLines={1} style={styles.nextUpTitle}>
          {episode.Name}
        </ThemedText>
        <ThemedText style={[styles.nextUpMeta, { color: colors.text.secondary }]}>
          S{episode.ParentIndexNumber} E{episode.IndexNumber}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch series details
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

  // Fetch seasons
  const { data: seasonsData, isLoading: isLoadingSeasons } = useQuery({
    ...getSeasonsOptions({
      path: { seriesId: id! },
      query: {
        fields: ['PrimaryImageAspectRatio', 'Overview'],
      },
    }),
    enabled: !!id,
  });

  // Fetch next up episode for this series
  const { data: nextUpData } = useQuery({
    ...getNextUpOptions({
      query: {
        seriesId: id!,
        limit: 1,
        fields: ['PrimaryImageAspectRatio', 'Overview'],
      },
    }),
    enabled: !!id,
  });

  // Fetch similar shows
  const { data: similarShows, isLoading: isLoadingSimilar } = useQuery({
    ...getSimilarShowsOptions({
      path: { itemId: id! },
      query: {
        limit: 12,
      },
    }),
    enabled: !!id,
  });

  // Mutations
  const markPlayedMutation = useMutation({
    ...markPlayedItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
      queryClient.invalidateQueries({ queryKey: ['getSeasons'] });
    },
  });

  const markUnplayedMutation = useMutation({
    ...markUnplayedItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
      queryClient.invalidateQueries({ queryKey: ['getSeasons'] });
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

  const handleSeasonPress = useCallback(
    (seasonId: string) => {
      router.push(`/item/season/${seasonId}`);
    },
    [router]
  );

  const handleNextUpPress = useCallback(
    (episodeId: string) => {
      router.push(`/item/episode/${episodeId}`);
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
          <ThemedText>Series not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const backdropUrl = getBackdropImageUrl(item, SCREEN_WIDTH * 2);
  const posterUrl = getPrimaryImageUrl(item, 200);
  const isWatched = item.UserData?.Played ?? false;
  const isFavorite = item.UserData?.IsFavorite ?? false;
  const yearRange = formatYearRange(item);
  const nextUpEpisode = nextUpData?.Items?.[0];
  const seasons = seasonsData?.Items ?? [];

  // Get cast (actors)
  const cast = item.People?.filter((p) => p.Type === 'Actor').slice(0, 20) ?? [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Back Button */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <View style={[styles.backButtonInner, { backgroundColor: colors.overlay.dark }]}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </View>
      </Pressable>

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
            colors={['transparent', colors.background.primary]}
            style={styles.gradient}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Poster and Title Row */}
          <View style={styles.titleRow}>
            {posterUrl && (
              <Image
                source={{ uri: posterUrl }}
                style={styles.poster}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={styles.titleInfo}>
              <ThemedText type="title" style={styles.title}>
                {item.Name}
              </ThemedText>

              {/* Metadata Row */}
              <View style={styles.metaRow}>
                {yearRange && (
                  <ThemedText style={[styles.metaText, { color: colors.text.secondary }]}>
                    {yearRange}
                  </ThemedText>
                )}
                {item.OfficialRating && (
                  <>
                    <ThemedText style={[styles.metaDot, { color: colors.text.tertiary }]}>
                      •
                    </ThemedText>
                    <View style={[styles.ratingBadge, { borderColor: colors.border.default }]}>
                      <ThemedText style={[styles.ratingBadgeText, { color: colors.text.secondary }]}>
                        {item.OfficialRating}
                      </ThemedText>
                    </View>
                  </>
                )}
              </View>

              {/* Status and episode count */}
              <View style={styles.statusRow}>
                {item.Status && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.Status === 'Continuing'
                            ? colors.status.success + '20'
                            : colors.background.secondary,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.Status === 'Continuing'
                              ? colors.status.success
                              : colors.text.secondary,
                        },
                      ]}
                    >
                      {item.Status === 'Continuing' ? 'Ongoing' : 'Ended'}
                    </ThemedText>
                  </View>
                )}
                {seasons.length > 0 && (
                  <ThemedText style={[styles.episodeCount, { color: colors.text.secondary }]}>
                    {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
                  </ThemedText>
                )}
              </View>

              {/* Ratings */}
              {(item.CommunityRating || item.CriticRating) && (
                <View style={styles.ratingsRow}>
                  {item.CommunityRating && (
                    <View style={styles.rating}>
                      <IconSymbol name="star.fill" size={16} color={colors.media.rating} />
                      <ThemedText style={styles.ratingText}>
                        {item.CommunityRating.toFixed(1)}
                      </ThemedText>
                    </View>
                  )}
                  {item.CriticRating && (
                    <View style={styles.rating}>
                      <ThemedText style={[styles.criticRating, { color: colors.text.secondary }]}>
                        {item.CriticRating}%
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleToggleWatched}
            >
              <IconSymbol
                name={isWatched ? 'checkmark.circle.fill' : 'checkmark'}
                size={24}
                color={isWatched ? colors.media.watched : colors.text.secondary}
              />
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={handleToggleFavorite}
            >
              <IconSymbol
                name={isFavorite ? 'heart.fill' : 'heart'}
                size={24}
                color={isFavorite ? colors.media.favorite : colors.text.secondary}
              />
            </Pressable>
          </View>

          {/* Next Up Episode */}
          {nextUpEpisode && nextUpEpisode.Id && (
            <View style={styles.nextUpSection}>
              <NextUpCard
                episode={nextUpEpisode}
                onPress={() => handleNextUpPress(nextUpEpisode.Id!)}
              />
            </View>
          )}

          {/* Overview */}
          {item.Overview && (
            <ThemedText style={[styles.overview, { color: colors.text.primary }]}>
              {formatOverview(item.Overview)}
            </ThemedText>
          )}

          {/* Genres */}
          {item.Genres && item.Genres.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                Genres
              </ThemedText>
              <View style={styles.genreRow}>
                {item.Genres.map((genre) => (
                  <View
                    key={genre}
                    style={[styles.genreChip, { backgroundColor: colors.background.secondary }]}
                  >
                    <ThemedText style={styles.genreText}>{genre}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Studios */}
          {item.Studios && item.Studios.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                Studio{item.Studios.length > 1 ? 's' : ''}
              </ThemedText>
              <ThemedText style={styles.studioText}>
                {item.Studios.map((s) => s.Name).join(', ')}
              </ThemedText>
            </View>
          )}

          {/* Seasons */}
          {seasons.length > 0 && (
            <View style={styles.seasonsSection}>
              <ThemedText type="subtitle" style={styles.seasonsTitle}>
                Seasons
              </ThemedText>
              {isLoadingSeasons ? (
                <ActivityIndicator size="small" />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonsScroll}
                >
                  {seasons.map((season) => (
                    <SeasonCard
                      key={season.Id}
                      season={season}
                      onPress={() => season.Id && handleSeasonPress(season.Id)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={styles.castSection}>
              <ThemedText type="subtitle" style={styles.castTitle}>
                Cast
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castScroll}
              >
                {cast.map((person) => (
                  <PersonCard key={person.Id ?? person.Name} person={person} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Similar Shows */}
        <MediaRow
          title="Similar Shows"
          items={similarShows?.Items}
          isLoading={isLoadingSimilar}
          showProgress={false}
        />
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
    height: 120,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
    marginTop: -60,
  },
  titleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: radii.md,
  },
  titleInfo: {
    flex: 1,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 14,
  },
  metaDot: {
    fontSize: 14,
  },
  ratingBadge: {
    borderWidth: 1,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  episodeCount: {
    fontSize: 13,
  },
  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  criticRating: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextUpSection: {
    marginTop: spacing.lg,
  },
  nextUpCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  nextUpImageContainer: {
    height: 140,
    position: 'relative',
  },
  nextUpImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextUpProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nextUpProgressBar: {
    height: '100%',
    backgroundColor: '#00a4dc',
  },
  nextUpPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextUpPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  nextUpInfo: {
    padding: spacing.md,
  },
  nextUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextUpTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextUpMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  genreChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  genreText: {
    fontSize: 13,
  },
  studioText: {
    fontSize: 15,
  },
  seasonsSection: {
    marginTop: spacing.xl,
  },
  seasonsTitle: {
    marginBottom: spacing.sm,
  },
  seasonsScroll: {
    paddingRight: spacing.md,
  },
  seasonCard: {
    width: 100,
    marginRight: spacing.md,
  },
  seasonPoster: {
    width: 100,
    height: 150,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  seasonPosterImage: {
    width: '100%',
    height: '100%',
  },
  watchedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  seasonEpisodes: {
    fontSize: 12,
  },
  castSection: {
    marginTop: spacing.xl,
  },
  castTitle: {
    marginBottom: spacing.sm,
  },
  castScroll: {
    paddingRight: spacing.md,
  },
  personCard: {
    width: 80,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  personImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  personImageInner: {
    width: '100%',
    height: '100%',
  },
  personName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  personRole: {
    fontSize: 11,
    textAlign: 'center',
  },
});
