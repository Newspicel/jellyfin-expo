import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useCallback, useState } from 'react';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { getPrimaryImageUrl } from '@/lib/images';
import { useColors, spacing, radii, animation, isAppleTV } from '@/theme';

interface PosterCardProps {
  item: BaseItemDto;
  width?: number;
  showTitle?: boolean;
  showProgress?: boolean;
  hasTVPreferredFocus?: boolean;
}

const ASPECT_RATIO = 2 / 3; // Standard poster aspect ratio

// Animation configuration
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

// TV-specific sizing - larger for 10-foot UI
const TV_CARD_WIDTH = 180;
const FOCUS_SCALE = 1.08;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PosterCard({
  item,
  width = TV_CARD_WIDTH,
  showTitle = true,
  showProgress = true,
  hasTVPreferredFocus = false,
}: PosterCardProps) {
  const router = useRouter();
  const colors = useColors();
  const imageUrl = getPrimaryImageUrl(item, width * 2); // 2x for retina
  const height = width / ASPECT_RATIO;

  // Focus state
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  // Calculate progress percentage
  const progress =
    item.UserData?.PlayedPercentage ??
    (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
      ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
      : 0);

  const handlePress = useCallback(() => {
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
        router.push(`/(tabs)/library/${item.Id}`);
        break;
      case 'MusicAlbum':
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'MusicArtist':
        router.push(`/item/movie/${item.Id}`);
        break;
      case 'Audio':
        break;
      default:
        console.warn(`Unknown item type: ${item.Type}`);
        router.push(`/item/movie/${item.Id}`);
    }
  }, [item.Id, item.Type, router]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, SPRING_CONFIG);
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, SPRING_CONFIG);
  }, [focusProgress]);

  // Animated styles for focus state
  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusProgress.value, [0, 1], [1, FOCUS_SCALE]);

    return {
      transform: [{ scale }],
    };
  });

  // Animated styles for the glow/shadow effect
  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(focusProgress.value, [0, 1], [0.1, 0.4]);
    const shadowRadius = interpolate(focusProgress.value, [0, 1], [4, 20]);
    const elevation = interpolate(focusProgress.value, [0, 1], [2, 12]);

    return {
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  });

  // Animated border glow
  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(focusProgress.value, [0, 1], [0, 3]);
    const borderOpacity = interpolate(focusProgress.value, [0, 1], [0, 1]);

    return {
      borderWidth,
      borderColor: `rgba(0, 164, 220, ${borderOpacity})`, // Jellyfin brand blue
    };
  });

  const displayTitle =
    item.Type === 'Episode' ? (item.SeriesName ?? item.Name) : item.Name;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        { width },
        animatedContainerStyle,
        animatedShadowStyle,
      ]}
      onPress={handlePress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      // Enable tvOS parallax effect for Apple TV
      {...(isAppleTV && { isTVSelectable: true })}
    >
      <Animated.View
        style={[
          styles.imageContainer,
          { width, height, backgroundColor: colors.background.secondary },
          animatedBorderStyle,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={animation.fast}
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

        {/* Focus indicator overlay */}
        {isFocused && (
          <View
            style={[
              styles.focusOverlay,
              { borderColor: colors.border.focus },
            ]}
          />
        )}

        {/* Progress bar */}
        {showProgress && progress > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: colors.media.progress,
                },
              ]}
            />
          </View>
        )}

        {/* Watched indicator */}
        {item.UserData?.Played && (
          <View
            style={[
              styles.watchedBadge,
              { backgroundColor: colors.media.watched },
            ]}
          >
            <ThemedText style={styles.watchedText}>✓</ThemedText>
          </View>
        )}
      </Animated.View>

      {showTitle && (
        <ThemedText
          numberOfLines={2}
          style={[
            styles.title,
            isFocused && styles.titleFocused,
          ]}
        >
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    // marginRight handled by parent layout
  },
  imageContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {},
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2, // Account for container border
    borderWidth: 0,
    // Subtle inner glow effect
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5, // Slightly larger for TV visibility
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    height: '100%',
  },
  watchedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: radii.full,
    width: 24, // Larger for TV
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedText: {
    fontSize: 14, // Larger for TV
    color: '#fff',
  },
  title: {
    marginTop: spacing.sm,
    fontSize: 16, // Larger for TV (10-foot UI)
    fontWeight: '500',
    textAlign: 'center',
  },
  titleFocused: {
    fontWeight: '600',
  },
  year: {
    fontSize: 14, // Larger for TV
    textAlign: 'center',
  },
});
