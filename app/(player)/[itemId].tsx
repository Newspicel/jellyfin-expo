import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { useMediaSegments } from '@/hooks/use-media-segments';
import { getItemOptions, getEpisodesOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';
import type { PlayMethod } from '@/api/generated/types.gen';
import { IconSymbol } from '@/components/ui';
import { SubtitleSelector, AudioSelector, NextEpisodeOverlay, SeekBar, VolumeControl, SkipSegmentButton } from '@/components/player';

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
  const [showSubtitleSelector, setShowSubtitleSelector] = useState(false);
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);

  // Time tracking state (updated via events)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);

  // Volume state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Controls auto-hide timer
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch item details for title display
  const { data: item } = useQuery({
    ...getItemOptions({
      path: { itemId: itemId! },
    }),
    enabled: !!itemId,
  });

  // Fetch adjacent episodes for next episode feature (only for episodes)
  const { data: adjacentEpisodes } = useQuery({
    ...getEpisodesOptions({
      path: { seriesId: item?.SeriesId ?? '' },
      query: {
        seasonId: item?.SeasonId ?? undefined,
        adjacentTo: itemId!,
        fields: ['Overview', 'PrimaryImageAspectRatio'],
      },
    }),
    enabled: !!itemId && !!item?.SeriesId && item?.Type === 'Episode',
  });

  // Find the next episode from adjacent data
  const nextEpisode = useMemo(() => {
    if (!adjacentEpisodes?.Items || !itemId) return null;
    const episodes = adjacentEpisodes.Items;
    const currentIndex = episodes.findIndex((e) => e.Id === itemId);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      return episodes[currentIndex + 1];
    }
    return null;
  }, [adjacentEpisodes?.Items, itemId]);

  // Fetch playback info using the hook
  const {
    playbackInfo,
    isLoading: playbackLoading,
    error: playbackError,
    setAudioTrack,
    setSubtitleTrack,
  } = usePlayback({
    itemId: itemId!,
    startTimeTicks,
    enabled: !!itemId,
  });

  // Fetch media segments for skip intro/outro functionality
  const { getActiveSegment } = useMediaSegments({
    itemId: itemId!,
    enabled: !!itemId,
  });

  // Get currently active skippable segment
  const activeSegment = useMemo(() => {
    return getActiveSegment(currentTime);
  }, [getActiveSegment, currentTime]);

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
    // Show next episode overlay if there's a next episode
    if (nextEpisode?.Id) {
      setShowNextEpisode(true);
    }
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
    volumeLevel: Math.round(volume * 100),
    isMuted,
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

  // Seek to specific time (from seek bar)
  const seekToTime = useCallback(
    (time: number) => {
      player.currentTime = time;
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  // Volume control handlers
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      player.volume = newVolume;
      setVolume(newVolume);
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  const handleMutedChange = useCallback(
    (muted: boolean) => {
      player.muted = muted;
      setIsMuted(muted);
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  // Pause hide timer during seeking
  const handleSeekStart = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
  }, []);

  const handleSeekEnd = useCallback(() => {
    resetHideTimer();
  }, [resetHideTimer]);

  // Track selection handlers
  const handleOpenSubtitles = useCallback(() => {
    setShowSubtitleSelector(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
  }, []);

  const handleOpenAudio = useCallback(() => {
    setShowAudioSelector(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
  }, []);

  const handleSubtitleSelect = useCallback(
    (index: number) => {
      setSubtitleTrack(index);
      resetHideTimer();
    },
    [setSubtitleTrack, resetHideTimer]
  );

  const handleAudioSelect = useCallback(
    (index: number) => {
      setAudioTrack(index);
      resetHideTimer();
    },
    [setAudioTrack, resetHideTimer]
  );

  // Skip segment handler (for intro, outro, etc.)
  const handleSkipSegment = useCallback(
    (endTimeSeconds: number) => {
      player.currentTime = endTimeSeconds;
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  // Next episode handlers
  const handlePlayNextEpisode = useCallback(() => {
    if (nextEpisode?.Id) {
      setShowNextEpisode(false);
      // Navigate to the next episode
      router.replace(`/(player)/${nextEpisode.Id}`);
    }
  }, [nextEpisode?.Id, router]);

  const handleCancelNextEpisode = useCallback(() => {
    setShowNextEpisode(false);
  }, []);

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

      {/* Skip segment button (intro, outro, etc.) */}
      <SkipSegmentButton
        segment={activeSegment}
        onSkip={handleSkipSegment}
        controlsVisible={showControls}
      />

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
            <View style={styles.topBarActions}>
              {/* Audio button */}
              {playbackInfo.audioTracks.length > 1 && (
                <Pressable style={styles.topBarButton} onPress={handleOpenAudio}>
                  <IconSymbol name="speaker.wave.2.fill" size={20} color="#fff" />
                </Pressable>
              )}
              {/* Subtitle button */}
              <Pressable style={styles.topBarButton} onPress={handleOpenSubtitles}>
                <IconSymbol
                  name="captions.bubble.fill"
                  size={20}
                  color={
                    playbackInfo.selectedSubtitleIndex !== null &&
                    playbackInfo.selectedSubtitleIndex >= 0
                      ? '#00a2ff'
                      : '#fff'
                  }
                />
              </Pressable>
            </View>
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

          {/* Bottom bar - Progress, time, and volume */}
          <View style={styles.bottomBar}>
            <View style={styles.seekBarContainer}>
              <SeekBar
                currentTime={currentTime}
                duration={duration}
                onSeek={seekToTime}
                onSeekStart={handleSeekStart}
                onSeekEnd={handleSeekEnd}
              />
            </View>
            <VolumeControl
              volume={volume}
              muted={isMuted}
              onVolumeChange={handleVolumeChange}
              onMutedChange={handleMutedChange}
              onInteractionStart={handleSeekStart}
              onInteractionEnd={handleSeekEnd}
            />
          </View>
        </SafeAreaView>
      )}

      {/* Track selectors */}
      <SubtitleSelector
        visible={showSubtitleSelector}
        tracks={playbackInfo.subtitleTracks}
        selectedIndex={playbackInfo.selectedSubtitleIndex}
        onSelect={handleSubtitleSelect}
        onClose={() => setShowSubtitleSelector(false)}
      />
      <AudioSelector
        visible={showAudioSelector}
        tracks={playbackInfo.audioTracks}
        selectedIndex={playbackInfo.selectedAudioIndex}
        onSelect={handleAudioSelect}
        onClose={() => setShowAudioSelector(false)}
      />

      {/* Next Episode Overlay */}
      {nextEpisode && (
        <NextEpisodeOverlay
          visible={showNextEpisode}
          nextEpisode={nextEpisode}
          countdownSeconds={10}
          onPlayNext={handlePlayNextEpisode}
          onCancel={handleCancelNextEpisode}
        />
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
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  seekBarContainer: {
    flex: 1,
  },
});
