import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { useVideoPlayer, VideoView, isPictureInPictureSupported } from 'expo-video';
import type { VideoView as VideoViewType } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useQuery } from '@tanstack/react-query';

import { usePlayback } from '@/hooks/use-playback';
import { useProgressReporting } from '@/hooks/use-progress-reporting';
import { useMediaSegments } from '@/hooks/use-media-segments';
import { useScreenOrientation } from '@/hooks/use-screen-orientation';
import { useControlsVisibility } from '@/hooks/use-controls-visibility';
import { getItemOptions, getEpisodesOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { PlayMethod } from '@/api/generated/types.gen';
import { IconSymbol } from '@/components/ui';
import {
  SkipSegmentButton,
  NextEpisodeOverlay,
  PlayerControls,
  TVPlayerControls,
  PlayerGestureHandler,
  BufferingIndicator,
  SubtitleSelector,
  AudioSelector,
} from '@/components/player';
import { isTV } from '@/theme';

// Seek amounts in seconds
const SEEK_BACKWARD_AMOUNT = 10;
const SEEK_FORWARD_AMOUNT = 30;

export default function PlayerScreen() {
  const { itemId, startTimeTicks: startTimeParam } = useLocalSearchParams<{
    itemId: string;
    startTimeTicks?: string;
  }>();
  const router = useRouter();

  // Parse start time from params (for resume functionality)
  const startTimeTicks = startTimeParam ? parseInt(startTimeParam, 10) : 0;

  // Lock screen to landscape on mobile
  useScreenOrientation();

  // Video view ref for PiP
  const videoViewRef = useRef<VideoViewType>(null);

  // Check PiP support
  const isPiPSupported = useMemo(() => {
    return Platform.OS !== 'web' && isPictureInPictureSupported();
  }, []);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [showSubtitleSelector, setShowSubtitleSelector] = useState(false);
  const [showAudioSelector, setShowAudioSelector] = useState(false);

  // Time tracking state (updated via events)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);

  // Fetch item details
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

  // Controls visibility with auto-hide
  const {
    visible: controlsVisible,
    toggle: toggleControls,
    resetTimer: resetControlsTimer,
    pauseTimer: pauseControlsTimer,
  } = useControlsVisibility({
    isPlaying,
    initialVisible: true,
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
    volumeLevel: 100,
    isMuted: false,
    enabled: !!playbackInfo,
  });

  // Close player
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

  // Seek by relative amount
  const handleSeekBy = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      player.currentTime = newTime;
      resetControlsTimer();
    },
    [player, currentTime, duration, resetControlsTimer]
  );

  // Seek backward
  const handleSeekBackward = useCallback(() => {
    handleSeekBy(-SEEK_BACKWARD_AMOUNT);
  }, [handleSeekBy]);

  // Seek forward
  const handleSeekForward = useCallback(() => {
    handleSeekBy(SEEK_FORWARD_AMOUNT);
  }, [handleSeekBy]);

  // Seek to absolute time
  const handleSeekTo = useCallback(
    (seconds: number) => {
      player.currentTime = seconds;
    },
    [player]
  );

  // Skip segment handler (for intro, outro, etc.)
  const handleSkipSegment = useCallback(
    (endTimeSeconds: number) => {
      player.currentTime = endTimeSeconds;
    },
    [player]
  );

  // Enter Picture-in-Picture mode
  const handleEnterPiP = useCallback(() => {
    try {
      videoViewRef.current?.startPictureInPicture();
    } catch (e) {
      console.warn('Failed to enter PiP:', e);
    }
  }, []);

  // Subtitle selector handlers
  const handleOpenSubtitles = useCallback(() => {
    setShowSubtitleSelector(true);
    pauseControlsTimer();
  }, [pauseControlsTimer]);

  const handleCloseSubtitles = useCallback(() => {
    setShowSubtitleSelector(false);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSelectSubtitle = useCallback(
    (index: number) => {
      setSubtitleTrack(index);
    },
    [setSubtitleTrack]
  );

  // Audio selector handlers
  const handleOpenAudio = useCallback(() => {
    setShowAudioSelector(true);
    pauseControlsTimer();
  }, [pauseControlsTimer]);

  const handleCloseAudio = useCallback(() => {
    setShowAudioSelector(false);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSelectAudio = useCallback(
    (index: number) => {
      setAudioTrack(index);
    },
    [setAudioTrack]
  );

  // Next episode handlers
  const handlePlayNextEpisode = useCallback(() => {
    if (nextEpisode?.Id) {
      setShowNextEpisode(false);
      router.replace(`/(player)/${nextEpisode.Id}`);
    }
  }, [nextEpisode?.Id, router]);

  const handleCancelNextEpisode = useCallback(() => {
    setShowNextEpisode(false);
  }, []);

  // Gesture handlers for double-tap seeking
  const handleDoubleTapLeft = useCallback(() => {
    handleSeekBy(-SEEK_BACKWARD_AMOUNT);
  }, [handleSeekBy]);

  const handleDoubleTapRight = useCallback(() => {
    handleSeekBy(SEEK_FORWARD_AMOUNT);
  }, [handleSeekBy]);

  // TV activity handler
  const handleTVActivity = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  // Debug: Log playback info
  useEffect(() => {
    if (playbackInfo) {
      console.log('Playback info:', {
        streamUrl: playbackInfo.streamUrl,
        playMethod: playbackInfo.playMethod,
        container: playbackInfo.mediaSource.Container,
      });
    }
  }, [playbackInfo]);

  // Build title for display
  const displayTitle = useMemo(() => {
    if (!item) return '';
    if (item.Type === 'Episode' && item.SeriesName) {
      const epInfo = item.ParentIndexNumber
        ? `S${item.ParentIndexNumber}E${item.IndexNumber}`
        : item.IndexNumber
          ? `E${item.IndexNumber}`
          : '';
      return epInfo ? `${item.SeriesName} - ${epInfo}` : item.SeriesName;
    }
    return item.Name ?? '';
  }, [item]);

  // Loading state
  if (playbackLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
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

  // TV platform uses native controls with TV-specific overlay
  if (isTV) {
    return (
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture
        />

        {/* TV Player Controls */}
        <TVPlayerControls
          visible={controlsVisible}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          title={item?.SeriesName ?? item?.Name ?? undefined}
          subtitle={displayTitle !== (item?.SeriesName ?? item?.Name) ? displayTitle : undefined}
          playMethod={playbackInfo.playMethod as 'DirectPlay' | 'DirectStream' | 'Transcode'}
          audioTrackCount={playbackInfo.audioTracks.length}
          subtitleTrackCount={playbackInfo.subtitleTracks.length}
          subtitlesEnabled={
            playbackInfo.selectedSubtitleIndex != null &&
            playbackInfo.selectedSubtitleIndex >= 0
          }
          onPlayPause={handlePlayPause}
          onSeekBy={handleSeekBy}
          onSeekTo={handleSeekTo}
          onBack={handleClose}
          onOpenSubtitles={handleOpenSubtitles}
          onOpenAudio={handleOpenAudio}
          onActivity={handleTVActivity}
        />

        {/* Buffering indicator */}
        <BufferingIndicator visible={isBuffering && !controlsVisible} />

        {/* Skip segment button */}
        <SkipSegmentButton
          segment={activeSegment}
          onSkip={handleSkipSegment}
          controlsVisible={controlsVisible}
        />

        {/* Subtitle selector modal */}
        <SubtitleSelector
          visible={showSubtitleSelector}
          tracks={playbackInfo.subtitleTracks}
          selectedIndex={playbackInfo.selectedSubtitleIndex}
          onSelect={handleSelectSubtitle}
          onClose={handleCloseSubtitles}
        />

        {/* Audio selector modal */}
        <AudioSelector
          visible={showAudioSelector}
          tracks={playbackInfo.audioTracks}
          selectedIndex={playbackInfo.selectedAudioIndex}
          onSelect={handleSelectAudio}
          onClose={handleCloseAudio}
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

  // Mobile platform uses custom controls with gesture handler
  return (
    <View style={styles.container}>
      {/* Gesture handler wrapper for tap/double-tap */}
      <PlayerGestureHandler
        onTap={toggleControls}
        onDoubleTapLeft={handleDoubleTapLeft}
        onDoubleTapRight={handleDoubleTapRight}
        enabled={!showSubtitleSelector && !showAudioSelector && !showNextEpisode}
      >
        {/* Video Player with custom controls */}
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture
        />

        {/* Buffering indicator */}
        <BufferingIndicator visible={isBuffering} />

        {/* Mobile Player Controls */}
        <PlayerControls
          visible={controlsVisible}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          title={displayTitle}
          playMethod={playbackInfo.playMethod as 'DirectPlay' | 'DirectStream' | 'Transcode'}
          audioTrackCount={playbackInfo.audioTracks.length}
          selectedSubtitleIndex={playbackInfo.selectedSubtitleIndex}
          isPiPSupported={isPiPSupported}
          onPlayPause={handlePlayPause}
          onSeekBackward={handleSeekBackward}
          onSeekForward={handleSeekForward}
          onSeekTo={handleSeekTo}
          onClose={handleClose}
          onOpenSubtitles={handleOpenSubtitles}
          onOpenAudio={handleOpenAudio}
          onEnterPiP={handleEnterPiP}
          onSeekStart={pauseControlsTimer}
          onSeekEnd={resetControlsTimer}
        />

        {/* Skip segment button - positioned dynamically based on controls visibility */}
        <SkipSegmentButton
          segment={activeSegment}
          onSkip={handleSkipSegment}
          controlsVisible={controlsVisible}
          bottomOffsetHidden={40}
          bottomOffsetVisible={100}
        />
      </PlayerGestureHandler>

      {/* Subtitle selector modal */}
      <SubtitleSelector
        visible={showSubtitleSelector}
        tracks={playbackInfo.subtitleTracks}
        selectedIndex={playbackInfo.selectedSubtitleIndex}
        onSelect={handleSelectSubtitle}
        onClose={handleCloseSubtitles}
      />

      {/* Audio selector modal */}
      <AudioSelector
        visible={showAudioSelector}
        tracks={playbackInfo.audioTracks}
        selectedIndex={playbackInfo.selectedAudioIndex}
        onSelect={handleSelectAudio}
        onClose={handleCloseAudio}
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
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
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
});
