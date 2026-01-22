/**
 * NextEpisodeOverlay - Overlay shown at the end of episode playback
 *
 * Displays next episode info with auto-play countdown, allowing users
 * to play now, cancel, or wait for auto-play.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';

import { IconSymbol } from '@/components/ui';
import { getBackdropImageUrl } from '@/lib/images';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';
import type { BaseItemDto } from '@/api/generated';

// =============================================================================
// TYPES
// =============================================================================

export interface NextEpisodeOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** The next episode to play */
  nextEpisode: BaseItemDto;
  /** Countdown duration in seconds (default: 10) */
  countdownSeconds?: number;
  /** Called when user chooses to play now or countdown reaches 0 */
  onPlayNext: () => void;
  /** Called when user cancels auto-play */
  onCancel: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format runtime ticks to human-readable string
 */
function formatRuntime(ticks: number | null | undefined): string {
  if (!ticks) return '';
  const minutes = Math.round(ticks / 600000000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NextEpisodeOverlay({
  visible,
  nextEpisode,
  countdownSeconds = 10,
  onPlayNext,
  onCancel,
}: NextEpisodeOverlayProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset countdown when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCountdown(countdownSeconds);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Clear interval and trigger play
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Fade out and clear countdown
      fadeAnim.setValue(0);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [visible, countdownSeconds, fadeAnim]);

  // Trigger auto-play when countdown reaches 0
  useEffect(() => {
    if (visible && countdown === 0) {
      onPlayNext();
    }
  }, [visible, countdown, onPlayNext]);

  const handlePlayNow = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    onPlayNext();
  }, [onPlayNext]);

  const handleCancel = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    onCancel();
  }, [onCancel]);

  if (!visible) {
    return null;
  }

  // Get thumbnail URL
  const thumbnailUrl = getBackdropImageUrl(nextEpisode, 400);

  // Episode display info
  const episodeNumber = nextEpisode.IndexNumber ?? '?';
  const seasonNumber = nextEpisode.ParentIndexNumber ?? '?';
  const episodeTitle = nextEpisode.Name || 'Next Episode';
  const runtime = formatRuntime(nextEpisode.RunTimeTicks);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="play.circle.fill" size={20} color="#00a2ff" />
          <Text style={styles.headerText}>Up Next</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </View>

        {/* Episode Card */}
        <View style={styles.episodeCard}>
          {/* Thumbnail */}
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <IconSymbol name="play.tv" size={32} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* Episode Info */}
          <View style={styles.episodeInfo}>
            <Text style={styles.episodeNumber}>
              S{seasonNumber} E{episodeNumber}
            </Text>
            <Text style={styles.episodeTitle} numberOfLines={2}>
              {episodeTitle}
            </Text>
            {runtime && (
              <Text style={styles.runtime}>{runtime}</Text>
            )}
          </View>
        </View>

        {/* Progress bar showing countdown */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: `${(countdown / countdownSeconds) * 100}%`,
              },
            ]}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.playButton]}
            onPress={handlePlayNow}
          >
            <IconSymbol name="play.fill" size={18} color="#fff" />
            <Text style={styles.buttonText}>Play Now</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <IconSymbol name="xmark" size={18} color="#fff" />
            <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  content: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: '#fff',
    flex: 1,
  },
  countdownBadge: {
    backgroundColor: '#00a2ff',
    borderRadius: radii.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: '#fff',
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 160,
    height: 90,
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  episodeNumber: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  episodeTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: '#fff',
    marginTop: spacing.xs,
  },
  runtime: {
    fontSize: fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.xs,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.full,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00a2ff',
    borderRadius: radii.full,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  playButton: {
    backgroundColor: '#00a2ff',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: '#fff',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default NextEpisodeOverlay;
