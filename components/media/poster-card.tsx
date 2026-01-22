import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { getPrimaryImageUrl } from '@/lib/images';

interface PosterCardProps {
  item: BaseItemDto;
  width?: number;
  showTitle?: boolean;
  showProgress?: boolean;
}

const ASPECT_RATIO = 2 / 3; // Standard poster aspect ratio

export function PosterCard({
  item,
  width = 120,
  showTitle = true,
  showProgress = true,
}: PosterCardProps) {
  const router = useRouter();
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
      default:
        router.push(`/item/movie/${item.Id}`);
    }
  };

  const displayTitle = item.Type === 'Episode'
    ? item.SeriesName ?? item.Name
    : item.Name;

  return (
    <Pressable style={[styles.container, { width }]} onPress={handlePress}>
      <View style={[styles.imageContainer, { width, height }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.placeholder, styles.image]} />
        )}

        {/* Progress bar */}
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}

        {/* Watched indicator */}
        {item.UserData?.Played && (
          <View style={styles.watchedBadge}>
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
        <ThemedText numberOfLines={1} style={styles.year}>
          {item.ProductionYear}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#3a3a3a',
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
    backgroundColor: '#00a4dc',
  },
  watchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#00a4dc',
    borderRadius: 10,
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
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  year: {
    fontSize: 12,
    opacity: 0.6,
  },
});
