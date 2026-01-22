import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { getPrimaryImageUrl } from '@/lib/images';
import { IconSymbol } from '@/components/ui';
import { useColors, spacing, radii } from '@/theme';

interface MediaListItemProps {
  item: BaseItemDto;
  showProgress?: boolean;
}

const POSTER_WIDTH = 80;
const POSTER_HEIGHT = POSTER_WIDTH * (3 / 2); // 2:3 aspect ratio

function formatRuntime(ticks: number | null | undefined): string | null {
  if (!ticks) return null;
  const minutes = Math.floor(ticks / 600000000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function MediaListItem({ item, showProgress = true }: MediaListItemProps) {
  const router = useRouter();
  const colors = useColors();
  const imageUrl = getPrimaryImageUrl(item, POSTER_WIDTH * 2); // 2x for retina

  // Calculate progress percentage
  const progress =
    item.UserData?.PlayedPercentage ??
    (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
      ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
      : 0);

  const handlePress = () => {
    if (!item.Id) return;

    switch (item.Type) {
      case 'Movie':
      case 'Video':
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
      case 'BoxSet':
      case 'Playlist':
      case 'CollectionFolder':
      case 'Folder':
        router.push(`/(tabs)/library/${item.Id}`);
        break;
      case 'MusicAlbum':
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'MusicArtist':
        router.push(`/item/movie/${item.Id}`);
        break;
      default:
        router.push(`/item/movie/${item.Id}`);
    }
  };

  const displayTitle =
    item.Type === 'Episode' ? item.SeriesName ?? item.Name : item.Name;

  const runtime = formatRuntime(item.RunTimeTicks);
  const rating = item.CommunityRating?.toFixed(1);

  // Build metadata line
  const metadataParts: string[] = [];
  if (item.ProductionYear) metadataParts.push(String(item.ProductionYear));
  if (runtime) metadataParts.push(runtime);
  const metadataLine = metadataParts.join(' • ');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.background.secondary : 'transparent' },
      ]}
      onPress={handlePress}
    >
      {/* Poster */}
      <View
        style={[
          styles.posterContainer,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[styles.poster, { backgroundColor: colors.background.tertiary }]}
          />
        )}

        {/* Progress bar */}
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%`, backgroundColor: colors.media.progress },
              ]}
            />
          </View>
        )}

        {/* Watched indicator */}
        {item.UserData?.Played && (
          <View style={[styles.watchedBadge, { backgroundColor: colors.media.watched }]}>
            <ThemedText style={styles.watchedText}>✓</ThemedText>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {displayTitle}
        </ThemedText>

        {metadataLine ? (
          <View style={styles.metadataRow}>
            <ThemedText
              numberOfLines={1}
              style={[styles.metadata, { color: colors.text.secondary }]}
            >
              {metadataLine}
            </ThemedText>
            {rating && (
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={12} color={colors.media.rating} />
                <ThemedText style={[styles.rating, { color: colors.text.secondary }]}>
                  {rating}
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}

        {item.Overview && (
          <ThemedText
            numberOfLines={2}
            style={[styles.overview, { color: colors.text.secondary }]}
          >
            {item.Overview}
          </ThemedText>
        )}
      </View>

      {/* Chevron */}
      <IconSymbol
        name="chevron.right"
        size={16}
        color={colors.text.tertiary}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: POSTER_HEIGHT + spacing.sm * 2,
  },
  posterContainer: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
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
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radii.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedText: {
    fontSize: 10,
    color: '#fff',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 13,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  rating: {
    fontSize: 13,
    marginLeft: 3,
  },
  overview: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
