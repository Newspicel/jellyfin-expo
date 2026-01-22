import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

export function SeekBar({
  currentTime,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: SeekBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  // Animated values for smooth interactions
  const thumbScale = useSharedValue(1);
  const barHeight = useSharedValue(4);

  // Calculate display values (use seek time while seeking)
  const displayTime = isSeeking ? seekTime : currentTime;
  const displayProgress = duration > 0 ? displayTime / duration : 0;

  // Handle layout to get bar width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time from x position
  const getTimeFromPosition = useCallback(
    (x: number): number => {
      if (barWidth <= 0 || duration <= 0) return 0;
      const clampedX = Math.max(0, Math.min(x, barWidth));
      return (clampedX / barWidth) * duration;
    },
    [barWidth, duration]
  );

  // Gesture handlers
  const startSeeking = useCallback(() => {
    setIsSeeking(true);
    onSeekStart?.();
  }, [onSeekStart]);

  const updateSeekTime = useCallback((time: number) => {
    setSeekTime(time);
  }, []);

  const endSeeking = useCallback(
    (time: number) => {
      setIsSeeking(false);
      onSeek(time);
      onSeekEnd?.();
    },
    [onSeek, onSeekEnd]
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      thumbScale.value = withTiming(1.5, { duration: 100 });
      barHeight.value = withTiming(6, { duration: 100 });
      const time = getTimeFromPosition(event.x);
      runOnJS(startSeeking)();
      runOnJS(updateSeekTime)(time);
    })
    .onUpdate((event) => {
      const time = getTimeFromPosition(event.x);
      runOnJS(updateSeekTime)(time);
    })
    .onEnd((event) => {
      thumbScale.value = withTiming(1, { duration: 100 });
      barHeight.value = withTiming(4, { duration: 100 });
      const time = getTimeFromPosition(event.x);
      runOnJS(endSeeking)(time);
    })
    .onFinalize(() => {
      thumbScale.value = withTiming(1, { duration: 100 });
      barHeight.value = withTiming(4, { duration: 100 });
    });

  // Tap gesture for instant seek
  const tapGesture = Gesture.Tap().onEnd((event) => {
    const time = getTimeFromPosition(event.x);
    runOnJS(onSeek)(time);
  });

  // Combined gesture
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated styles
  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>{formatTime(displayTime)}</Text>

      <GestureDetector gesture={composedGesture}>
        <View style={styles.barContainer} onLayout={handleLayout}>
          <Animated.View style={[styles.progressBackground, barAnimatedStyle]}>
            <View
              style={[
                styles.progressFill,
                { width: `${displayProgress * 100}%` },
              ]}
            />
          </Animated.View>

          {/* Thumb indicator */}
          <Animated.View
            style={[
              styles.thumb,
              thumbAnimatedStyle,
              { left: `${displayProgress * 100}%` },
            ]}
          />

          {/* Seek time tooltip (shown while seeking) */}
          {isSeeking && (
            <View
              style={[
                styles.seekTooltip,
                {
                  left: `${displayProgress * 100}%`,
                },
              ]}
            >
              <Text style={styles.seekTooltipText}>{formatTime(seekTime)}</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 60,
  },
  barContainer: {
    flex: 1,
    height: 40, // Larger touch target
    justifyContent: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginLeft: -8, // Center the thumb
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  seekTooltip: {
    position: 'absolute',
    bottom: 30,
    marginLeft: -30,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  seekTooltipText: {
    color: '#fff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
