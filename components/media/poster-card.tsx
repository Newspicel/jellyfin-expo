import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { getPrimaryImageUrl } from '@/lib/images';
import { useColors, spacing, radii } from '@/theme';

interface PosterCardProps {
  item: BaseItemDto;
  width?: number;
  showTitle?: boolean;
  showProgress?: boolean;
  /** TV focus hint - ignored on mobile */
  hasTVPreferredFocus?: boolean;
}

const ASPECT_RATIO = 2 / 3; // Standard poster aspect ratio

export function PosterCard({
  item,
  width = 120,
  showTitle = true,
  showProgress = true,
}: PosterCardProps) {
  const router = useRouter();
  const colors = useColors();
  const imageUrl = getPrimaryImageUrl(item, width * 2); // 2x for retina
  const height = width / ASPECT_RATIO;

  // Calculate progress percentage
  const progress =
    item.UserData?.PlayedPercentage ??
    (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
      ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
      : 0);

  const handlePress = () => {
    if (!item.Id) return;

    // Navigate based on item type
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
        // TODO: Implement collection/folder views
        // For now, navigate to the library view with this as parent
        router.push(`/(tabs)/library/${item.Id}`);
        break;
      case 'MusicAlbum':
        // TODO: Implement album view
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'MusicArtist':
        // TODO: Implement artist view
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'Audio':
        // TODO: Implement audio player
        break;
      default:
        // For unknown types, try to show as movie (generic detail view)
        console.warn(`Unknown item type: ${item.Type}`);
        router.push(`/item/movie/${item.Id}`);
    }
  };

  const displayTitle = item.Type === 'Episode'
    ? item.SeriesName ?? item.Name
    : item.Name;

  return (
    <Pressable style={[styles.container, { width }]} onPress={handlePress}>
      <View
        style={[
          styles.imageContainer,
          { width, height, backgroundColor: colors.background.secondary },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              styles.image,
              { backgroundColor: colors.background.tertiary },
            ]}
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

      {showTitle && (
        <ThemedText numberOfLines={2} style={styles.title}>
          {displayTitle}
        </ThemedText>
      )}

      {showTitle && item.ProductionYear && (
        <ThemedText
          numberOfLines={1}
          style={[styles.year, { color: colors.text.secondary }]}
        >
          {item.ProductionYear}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginRight handled by parent layout
  },
  imageContainer: {
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {},
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
  watchedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    borderRadius: radii.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedText: {
    fontSize: 12,
    color: '#fff',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '500',
  },
  year: {
    fontSize: 12,
  },
});
