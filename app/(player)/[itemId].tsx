import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useQuery } from '@tanstack/react-query';

import { usePlayback } from '@/hooks/use-playback';
import { useProgressReporting } from '@/hooks/use-progress-reporting';
import { getItemOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';
import type { PlayMethod } from '@/api/generated/types.gen';
import { IconSymbol } from '@/components/ui';

// Hide controls after inactivity (ms)
const CONTROLS_HIDE_DELAY = 4000;

export default function PlayerScreen() {
  const { itemId, startTimeTicks: startTimeParam } = useLocalSearchParams<{
    itemId: string;
    startTimeTicks?: string;
  }>();
  const router = useRouter();

  // Parse start time from params (for resume functionality)
  const startTimeTicks = startTimeParam ? parseInt(startTimeParam, 10) : 0;

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time tracking state (updated via events)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);

  // Controls auto-hide timer
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch item details for title display
  const { data: item } = useQuery({
    ...getItemOptions({
      path: { itemId: itemId! },
    }),
    enabled: !!itemId,
  });

  // Fetch playback info using the hook
  const {
    playbackInfo,
    isLoading: playbackLoading,
    error: playbackError,
  } = usePlayback({
    itemId: itemId!,
    startTimeTicks,
    enabled: !!itemId,
  });

  // Create video player with expo-video
  const player = useVideoPlayer(playbackInfo?.streamUrl ?? null, (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  // Track playing state via useEvent
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  // Track status changes for buffering and errors
  useEventListener(player, 'statusChange', ({ status, error: playerError }) => {
    if (status === 'loading') {
      setIsBuffering(true);
    } else if (status === 'readyToPlay') {
      setIsBuffering(false);
      setDuration(player.duration);
    } else if (status === 'error') {
      setIsBuffering(false);
      setError(playerError?.message ?? 'Playback error occurred');
    }
  });

  // Track time updates
  useEventListener(player, 'timeUpdate', ({ currentTime: time }) => {
    setCurrentTime(time);
  });

  // Track playback end
  useEventListener(player, 'playToEnd', () => {
    player.pause();
    setShowControls(true);
  });

  // Report playback progress to Jellyfin server
  useProgressReporting({
    itemId: itemId!,
    mediaSourceId: playbackInfo?.mediaSource.Id ?? null,
    playSessionId: playbackInfo?.playSessionId ?? null,
    playMethod: (playbackInfo?.playMethod ?? 'DirectPlay') as PlayMethod,
    currentTimeSeconds: currentTime,
    durationSeconds: duration,
    isPaused: !isPlaying,
    isReady: !isBuffering && !!playbackInfo,
    audioStreamIndex: playbackInfo?.selectedAudioIndex,
    subtitleStreamIndex: playbackInfo?.selectedSubtitleIndex,
    enabled: !!playbackInfo,
  });

  // Reset controls hide timer
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY);
  }, [isPlaying]);

  // Handle screen tap to toggle controls
  const handleScreenTap = useCallback(() => {
    if (showControls) {
      setShowControls(false);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    } else {
      resetHideTimer();
    }
  }, [showControls, resetHideTimer]);

  // Play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    resetHideTimer();
  }, [isPlaying, player, resetHideTimer]);

  // Close player
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Seek handlers
  const seekBackward = useCallback(() => {
    player.seekBy(-10);
    resetHideTimer();
  }, [player, resetHideTimer]);

  const seekForward = useCallback(() => {
    player.seekBy(30);
    resetHideTimer();
  }, [player, resetHideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  // Start auto-hide timer when playing
  useEffect(() => {
    if (isPlaying && showControls) {
      resetHideTimer();
    }
  }, [isPlaying, showControls, resetHideTimer]);

  // Debug: Log playback info
  useEffect(() => {
    if (playbackInfo) {
      const serverProvidedTranscodeUrl = playbackInfo.mediaSource.TranscodingUrl;
      console.log('Playback info:', {
        streamUrl: playbackInfo.streamUrl,
        playMethod: playbackInfo.playMethod,
        container: playbackInfo.mediaSource.Container,
        urlSource: serverProvidedTranscodeUrl ? 'server' : 'client-built',
      });
    }
  }, [playbackInfo]);

  // Format time for display (seconds to hh:mm:ss)
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get display title
  const getTitle = (itemData: BaseItemDto | undefined): string => {
    if (!itemData) return '';
    if (itemData.Type === 'Episode' && itemData.SeriesName) {
      return `${itemData.SeriesName} - S${itemData.ParentIndexNumber}E${itemData.IndexNumber}`;
    }
    return itemData.Name || '';
  };

  // Loading state
  if (playbackLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading playback info...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (playbackError || error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <IconSymbol name="xmark" size={24} color="#fff" />
          </Pressable>
          <View style={styles.centerContent}>
            <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Playback Error</Text>
            <Text style={styles.errorText}>
              {error || playbackError?.message || 'Unable to play this video'}
            </Text>
            <Pressable style={styles.retryButton} onPress={handleClose}>
              <Text style={styles.retryText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // No playback info available
  if (!playbackInfo) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <IconSymbol name="xmark" size={24} color="#fff" />
          </Pressable>
          <View style={styles.centerContent}>
            <IconSymbol name="film" size={48} color="#666" />
            <Text style={styles.errorTitle}>Unable to Play</Text>
            <Text style={styles.errorText}>
              No compatible playback source found for this video.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Pressable style={styles.videoContainer} onPress={handleScreenTap}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture
        />
      </Pressable>

      {/* Buffering indicator */}
      {isBuffering && (
        <View style={styles.bufferingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Controls overlay */}
      {showControls && (
        <SafeAreaView style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Top bar - Close button and title */}
          <View style={styles.topBar}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <IconSymbol name="xmark" size={24} color="#fff" />
            </Pressable>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {getTitle(item)}
              </Text>
              {playbackInfo.playMethod !== 'DirectPlay' && (
                <Text style={styles.transcodeIndicator}>
                  {playbackInfo.playMethod === 'Transcode' ? 'Transcoding' : 'Direct Stream'}
                </Text>
              )}
            </View>
            <View style={styles.spacer} />
          </View>

          {/* Center controls - Play/Pause, Seek */}
          <View style={styles.centerControls}>
            <Pressable style={styles.seekButton} onPress={seekBackward}>
              <IconSymbol name="gobackward.10" size={36} color="#fff" />
            </Pressable>
            <Pressable style={styles.playPauseButton} onPress={togglePlayPause}>
              <IconSymbol
                name={isPlaying ? 'pause.fill' : 'play.fill'}
                size={48}
                color="#fff"
              />
            </Pressable>
            <Pressable style={styles.seekButton} onPress={seekForward}>
              <IconSymbol name="goforward.30" size={36} color="#fff" />
            </Pressable>
          </View>

          {/* Bottom bar - Progress and time */}
          <View style={styles.bottomBar}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
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
  spacer: {
    width: 44,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 12,
    gap: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 60,
  },
  progressContainer: {
    flex: 1,
    height: 4,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});
