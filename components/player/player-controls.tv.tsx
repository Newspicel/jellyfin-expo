/**
 * TV Player Controls
 *
 * D-pad and remote-optimized player controls for Apple TV and Android TV.
 * Features:
 * - Focus-based navigation between controls
 * - Center/select button for play/pause
 * - D-pad left/right for seeking (or swipe on Apple TV)
 * - Back button handling
 * - Auto-hide after inactivity
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useTVEventHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui';
import { spacing, radii } from '@/theme';

// Seek amounts in seconds
const SEEK_BACKWARD_AMOUNT = 10;
const SEEK_FORWARD_AMOUNT = 30;
const SEEK_LARGE_AMOUNT = 60; // For holding down direction

// Spring config for focus animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

// Focus scale for TV controls
const FOCUS_SCALE = 1.15;

interface TVPlayerControlsProps {
  /** Whether controls should be visible */
  visible: boolean;
  /** Whether video is currently playing */
  isPlaying: boolean;
  /** Whether video is buffering */
  isBuffering?: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Title to display */
  title?: string;
  /** Subtitle (e.g., "S1 E5 - Episode Title") */
  subtitle?: string;
  /** Play method indicator */
  playMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
  /** Number of available audio tracks */
  audioTrackCount?: number;
  /** Number of available subtitle tracks */
  subtitleTrackCount?: number;
  /** Whether subtitles are currently enabled */
  subtitlesEnabled?: boolean;
  /** Callback to toggle play/pause */
  onPlayPause: () => void;
  /** Callback to seek by relative amount (seconds) */
  onSeekBy: (seconds: number) => void;
  /** Callback to seek to absolute time (seconds) */
  onSeekTo: (seconds: number) => void;
  /** Callback when back/menu is pressed */
  onBack: () => void;
  /** Callback to open subtitle selector */
  onOpenSubtitles?: () => void;
  /** Callback to open audio selector */
  onOpenAudio?: () => void;
  /** Callback when any input is received (for auto-hide) */
  onActivity?: () => void;
}

// Animated pressable for focus effects
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Format time for display (HH:MM:SS or MM:SS)
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * TV-optimized control button with focus animations
 */
interface TVButtonProps {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel: string;
  isActive?: boolean;
}

function TVButton({
  icon,
  onPress,
  size = 'medium',
  label,
  hasTVPreferredFocus = false,
  accessibilityLabel,
  isActive = false,
}: TVButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const buttonSize = size === 'large' ? 80 : size === 'medium' ? 60 : 48;
  const iconSize = size === 'large' ? 40 : size === 'medium' ? 28 : 22;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, SPRING_CONFIG);
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, SPRING_CONFIG);
  }, [focusProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusProgress.value, [0, 1], [1, FOCUS_SCALE]);
    return {
      transform: [{ scale }],
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(focusProgress.value, [0, 1], [0, 3]);
    const borderOpacity = interpolate(focusProgress.value, [0, 1], [0, 1]);
    return {
      borderWidth,
      borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
    };
  });

  return (
    <View style={styles.buttonWrapper}>
      <AnimatedPressable
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isFocused
              ? 'rgba(255, 255, 255, 0.3)'
              : 'rgba(255, 255, 255, 0.15)',
          },
          animatedStyle,
          animatedBorderStyle,
        ]}
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <IconSymbol
          name={icon}
          size={iconSize}
          color={isActive ? '#00a4dc' : '#fff'}
        />
      </AnimatedPressable>
      {label && (
        <Text
          style={[
            styles.buttonLabel,
            isFocused && styles.buttonLabelFocused,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

/**
 * TV progress bar (non-interactive, shows current position)
 */
function TVProgressBar({
  currentTime,
  duration,
}: {
  currentTime: number;
  duration: number;
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
        <View
          style={[
            styles.progressThumb,
            { left: `${progress}%` },
          ]}
        />
      </View>
      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  );
}

export function TVPlayerControls({
  visible,
  isPlaying,
  currentTime,
  duration,
  title,
  subtitle,
  playMethod,
  audioTrackCount = 0,
  subtitleTrackCount = 0,
  subtitlesEnabled = false,
  onPlayPause,
  onSeekBy,
  onBack,
  onOpenSubtitles,
  onOpenAudio,
  onActivity,
}: TVPlayerControlsProps) {
  const opacity = useSharedValue(visible ? 1 : 0);

  // Update opacity when visibility changes
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  // Handle TV remote events
  useTVEventHandler((evt) => {
    // Notify activity on any input
    onActivity?.();

    // If controls aren't visible, just show them on any input
    if (!visible) {
      return;
    }

    switch (evt.eventType) {
      case 'playPause':
        // Center button on Apple TV remote
        onPlayPause();
        break;
      case 'select':
        // Select button on Android TV / older remotes
        // Let the focused button handle this
        break;
      case 'left':
        onSeekBy(-SEEK_BACKWARD_AMOUNT);
        break;
      case 'right':
        onSeekBy(SEEK_FORWARD_AMOUNT);
        break;
      case 'longLeft':
        onSeekBy(-SEEK_LARGE_AMOUNT);
        break;
      case 'longRight':
        onSeekBy(SEEK_LARGE_AMOUNT);
        break;
      case 'swipeLeft':
        // Apple TV swipe gesture - larger seek
        onSeekBy(-SEEK_FORWARD_AMOUNT);
        break;
      case 'swipeRight':
        // Apple TV swipe gesture - larger seek
        onSeekBy(SEEK_FORWARD_AMOUNT);
        break;
      case 'menu':
      case 'back':
        onBack();
        break;
    }
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Don't render if not visible (after fade out)
  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top bar - Title and status */}
        <View style={styles.topBar}>
          <View style={styles.titleContainer}>
            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={styles.statusContainer}>
            {playMethod && playMethod !== 'DirectPlay' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {playMethod === 'Transcode' ? 'Transcoding' : 'Direct Stream'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Center controls */}
        <View style={styles.centerControls}>
          <TVButton
            icon="gobackward.10"
            onPress={() => onSeekBy(-SEEK_BACKWARD_AMOUNT)}
            size="medium"
            label="10s"
            accessibilityLabel="Rewind 10 seconds"
          />
          <TVButton
            icon={isPlaying ? 'pause.fill' : 'play.fill'}
            onPress={onPlayPause}
            size="large"
            hasTVPreferredFocus
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          />
          <TVButton
            icon="goforward.30"
            onPress={() => onSeekBy(SEEK_FORWARD_AMOUNT)}
            size="medium"
            label="30s"
            accessibilityLabel="Fast forward 30 seconds"
          />
        </View>

        {/* Bottom bar - Progress and options */}
        <View style={styles.bottomBar}>
          <TVProgressBar currentTime={currentTime} duration={duration} />

          {/* Track options */}
          <View style={styles.optionsRow}>
            {audioTrackCount > 1 && onOpenAudio && (
              <TVButton
                icon="speaker.wave.2.fill"
                onPress={onOpenAudio}
                size="small"
                accessibilityLabel={`Audio tracks: ${audioTrackCount} available`}
              />
            )}
            {subtitleTrackCount > 0 && onOpenSubtitles && (
              <TVButton
                icon="captions.bubble.fill"
                onPress={onOpenSubtitles}
                size="small"
                isActive={subtitlesEnabled}
                accessibilityLabel={`Subtitles: ${subtitlesEnabled ? 'On' : 'Off'}, ${subtitleTrackCount} available`}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.lg,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 20,
    marginTop: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  buttonLabelFocused: {
    color: '#fff',
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    minWidth: 80,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
});

export type { TVPlayerControlsProps };
