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
  getSimilarMoviesOptions,
  markPlayedItemMutation,
  markUnplayedItemMutation,
  markFavoriteItemMutation,
  unmarkFavoriteItemMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemPerson } from '@/api/generated';
import { getBackdropImageUrl, getPrimaryImageUrl, getPersonImageUrl } from '@/lib/images';
import { useColors, spacing, radii } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = 280;

function formatRuntime(ticks: number | null | undefined): string {
  if (!ticks) return '';
  const minutes = Math.round(ticks / 600000000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

function formatOverview(text: string | null | undefined): string {
  if (!text) return '';
  // Replace <br>, <br/>, <br /> with newlines
  return text.replace(/<br\s*\/?>/gi, '\n');
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

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch movie details
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

  // Fetch similar movies
  const { data: similarMovies, isLoading: isLoadingSimilar } = useQuery({
    ...getSimilarMoviesOptions({
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
    },
  });

  const markUnplayedMutation = useMutation({
    ...markUnplayedItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getItem'] });
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
    // TODO: Navigate to player when implemented
    // router.push(`/(player)/${id}`);
  }, [id]);

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
          <ThemedText>Movie not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const backdropUrl = getBackdropImageUrl(item, SCREEN_WIDTH * 2);
  const posterUrl = getPrimaryImageUrl(item, 200);
  const isWatched = item.UserData?.Played ?? false;
  const isFavorite = item.UserData?.IsFavorite ?? false;

  // Get cast (actors)
  const cast = item.People?.filter((p) => p.Type === 'Actor').slice(0, 20) ?? [];
  // Get directors
  const directors = item.People?.filter((p) => p.Type === 'Director') ?? [];

  // Get video stream info
  const videoStream = item.MediaStreams?.find((s) => s.Type === 'Video');
  const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio') ?? [];

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
                {item.ProductionYear && (
                  <ThemedText style={[styles.metaText, { color: colors.text.secondary }]}>
                    {item.ProductionYear}
                  </ThemedText>
                )}
                {item.RunTimeTicks && (
                  <>
                    <ThemedText style={[styles.metaDot, { color: colors.text.tertiary }]}>

                    </ThemedText>
                    <ThemedText style={[styles.metaText, { color: colors.text.secondary }]}>
                      {formatRuntime(item.RunTimeTicks)}
                    </ThemedText>
                  </>
                )}
                {item.OfficialRating && (
                  <>
                    <ThemedText style={[styles.metaDot, { color: colors.text.tertiary }]}>

                    </ThemedText>
                    <View style={[styles.ratingBadge, { borderColor: colors.border.default }]}>
                      <ThemedText style={[styles.ratingBadgeText, { color: colors.text.secondary }]}>
                        {item.OfficialRating}
                      </ThemedText>
                    </View>
                  </>
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
              style={[styles.playButton, { backgroundColor: colors.interactive.primary }]}
              onPress={handlePlay}
            >
              <IconSymbol name="play.fill" size={24} color="#fff" />
              <ThemedText style={styles.playButtonText}>Play</ThemedText>
            </Pressable>

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

          {/* Tagline */}
          {item.Taglines?.[0] && (
            <ThemedText style={[styles.tagline, { color: colors.text.secondary }]}>
              &ldquo;{item.Taglines[0]}&rdquo;
            </ThemedText>
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

          {/* Directors */}
          {directors.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                Director{directors.length > 1 ? 's' : ''}
              </ThemedText>
              <ThemedText style={styles.directorText}>
                {directors.map((d) => d.Name).join(', ')}
              </ThemedText>
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

          {/* Media Info */}
          {videoStream && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.mediaInfoTitle}>
                Media Info
              </ThemedText>
              <View style={[styles.mediaInfoCard, { backgroundColor: colors.background.secondary }]}>
                {videoStream.DisplayTitle && (
                  <View style={styles.mediaInfoRow}>
                    <ThemedText style={[styles.mediaInfoLabel, { color: colors.text.secondary }]}>
                      Video
                    </ThemedText>
                    <ThemedText style={styles.mediaInfoValue} numberOfLines={1}>
                      {videoStream.DisplayTitle}
                    </ThemedText>
                  </View>
                )}
                {videoStream.Width && videoStream.Height && (
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
              </View>
            </View>
          )}
        </View>

        {/* Similar Movies */}
        <MediaRow
          title="Similar Movies"
          items={similarMovies?.Items}
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
  tagline: {
    fontStyle: 'italic',
    fontSize: 15,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
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
  directorText: {
    fontSize: 15,
  },
  studioText: {
    fontSize: 15,
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
