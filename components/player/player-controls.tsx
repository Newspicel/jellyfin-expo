/**
 * Mobile Player Controls
 *
 * Touch-optimized player controls for iOS and Android devices.
 * Features:
 * - Touch controls for play/pause, seek
 * - Subtitle and audio track selection buttons
 * - Picture-in-Picture button
 * - Auto-hide after inactivity
 * - Gradient overlays for better visibility
 *
 * Note: Volume is controlled via hardware buttons on mobile.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui';
import { SeekBar } from './seek-bar';
import { spacing } from '@/theme';

// Auto-hide controls after this delay (ms)
const CONTROLS_HIDE_DELAY = 4000;

export interface PlayerControlsProps {
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
  /** Play method indicator */
  playMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
  /** Number of available audio tracks */
  audioTrackCount?: number;
  /** Current subtitle index (-1 for off) */
  selectedSubtitleIndex?: number | null;
  /** Whether PiP is supported on this device */
  isPiPSupported?: boolean;
  /** Callback to toggle play/pause */
  onPlayPause: () => void;
  /** Callback to seek backward (seconds) */
  onSeekBackward: () => void;
  /** Callback to seek forward (seconds) */
  onSeekForward: () => void;
  /** Callback to seek to absolute time (seconds) */
  onSeekTo: (seconds: number) => void;
  /** Callback when close button is pressed */
  onClose: () => void;
  /** Callback to open subtitle selector */
  onOpenSubtitles?: () => void;
  /** Callback to open audio selector */
  onOpenAudio?: () => void;
  /** Callback to enter Picture-in-Picture mode */
  onEnterPiP?: () => void;
  /** Callback when controls visibility should change */
  onVisibilityChange?: (visible: boolean) => void;
  /** Callback when seek starts (pause auto-hide) */
  onSeekStart?: () => void;
  /** Callback when seek ends (resume auto-hide) */
  onSeekEnd?: () => void;
}

export function PlayerControls({
  visible,
  isPlaying,
  currentTime,
  duration,
  title,
  playMethod,
  audioTrackCount = 0,
  selectedSubtitleIndex,
  isPiPSupported = false,
  onPlayPause,
  onSeekBackward,
  onSeekForward,
  onSeekTo,
  onClose,
  onOpenSubtitles,
  onOpenAudio,
  onEnterPiP,
  onVisibilityChange,
  onSeekStart,
  onSeekEnd,
}: PlayerControlsProps) {
  const opacity = useSharedValue(visible ? 1 : 0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  // Update opacity when visibility changes
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  // Reset auto-hide timer
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    if (isPlaying) {
      hideTimer.current = setTimeout(() => {
        onVisibilityChange?.(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [isPlaying, onVisibilityChange]);

  // Start hide timer when playing
  useEffect(() => {
    if (visible && isPlaying) {
      resetHideTimer();
    } else if (!isPlaying && hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [visible, isPlaying, resetHideTimer]);

  // Handle seek bar interaction
  const handleSeekStart = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    onSeekStart?.();
  }, [onSeekStart]);

  const handleSeekEnd = useCallback(() => {
    resetHideTimer();
    onSeekEnd?.();
  }, [resetHideTimer, onSeekEnd]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Don't render if not visible (saves resources)
  if (!visible && opacity.value === 0) {
    return null;
  }

  const subtitlesEnabled =
    selectedSubtitleIndex != null && selectedSubtitleIndex >= 0;

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      {/* Top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {/* Top bar - Close button, title, and options */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close player"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color="#fff" />
          </Pressable>

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {playMethod && playMethod !== 'DirectPlay' && (
              <Text style={styles.transcodeIndicator}>
                {playMethod === 'Transcode' ? 'Transcoding' : 'Direct Stream'}
              </Text>
            )}
          </View>

          <View style={styles.topBarActions}>
            {/* Audio button */}
            {audioTrackCount > 1 && onOpenAudio && (
              <Pressable
                style={styles.topBarButton}
                onPress={onOpenAudio}
                accessibilityLabel={`Audio tracks: ${audioTrackCount} available`}
                accessibilityRole="button"
              >
                <IconSymbol name="speaker.wave.2.fill" size={20} color="#fff" />
              </Pressable>
            )}

            {/* Subtitle button */}
            {onOpenSubtitles && (
              <Pressable
                style={styles.topBarButton}
                onPress={onOpenSubtitles}
                accessibilityLabel={`Subtitles: ${subtitlesEnabled ? 'On' : 'Off'}`}
                accessibilityRole="button"
              >
                <IconSymbol
                  name="captions.bubble.fill"
                  size={20}
                  color={subtitlesEnabled ? '#00a2ff' : '#fff'}
                />
              </Pressable>
            )}

            {/* Picture-in-Picture button */}
            {isPiPSupported && onEnterPiP && (
              <Pressable
                style={styles.topBarButton}
                onPress={onEnterPiP}
                accessibilityLabel="Enter Picture in Picture"
                accessibilityRole="button"
              >
                <IconSymbol
                  name="pip.enter"
                  size={20}
                  color="#fff"
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Center controls - Seek backward, Play/Pause, Seek forward */}
        <View style={styles.centerControls}>
          <Pressable
            style={styles.seekButton}
            onPress={onSeekBackward}
            accessibilityLabel="Rewind 10 seconds"
            accessibilityRole="button"
          >
            <IconSymbol name="gobackward.10" size={36} color="#fff" />
          </Pressable>

          <Pressable
            style={styles.playPauseButton}
            onPress={onPlayPause}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            accessibilityRole="button"
          >
            <IconSymbol
              name={isPlaying ? 'pause.fill' : 'play.fill'}
              size={48}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={styles.seekButton}
            onPress={onSeekForward}
            accessibilityLabel="Fast forward 30 seconds"
            accessibilityRole="button"
          >
            <IconSymbol name="goforward.30" size={36} color="#fff" />
          </Pressable>
        </View>

        {/* Bottom bar - Seek bar only (volume via hardware buttons) */}
        <View style={styles.bottomBar}>
          <View style={styles.seekBarContainer}>
            <SeekBar
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeekTo}
              onSeekStart={handleSeekStart}
              onSeekEnd={handleSeekEnd}
            />
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  transcodeIndicator: {
    color: '#ff9500',
    fontSize: 12,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  topBarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  seekButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
  },
  bottomBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    paddingTop: spacing.sm,
  },
  seekBarContainer: {
    flex: 1,
  },
});
