import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui';

export interface VolumeControlProps {
  /** Current volume level (0-1) */
  volume: number;
  /** Whether audio is muted */
  muted: boolean;
  /** Called when volume changes */
  onVolumeChange: (volume: number) => void;
  /** Called when mute state changes */
  onMutedChange: (muted: boolean) => void;
  /** Optional callback when interaction starts */
  onInteractionStart?: () => void;
  /** Optional callback when interaction ends */
  onInteractionEnd?: () => void;
}

export function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
  onInteractionStart,
  onInteractionEnd,
}: VolumeControlProps) {
  const [barWidth, setBarWidth] = useState(0);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustedVolume, setAdjustedVolume] = useState(volume);

  // Animated values
  const thumbScale = useSharedValue(1);
  const barHeight = useSharedValue(4);

  // Display volume (use adjusted volume while dragging)
  const displayVolume = isAdjusting ? adjustedVolume : volume;

  // Handle layout to get bar width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  }, []);

  // Calculate volume from x position
  const getVolumeFromPosition = useCallback(
    (x: number): number => {
      if (barWidth <= 0) return 0;
      const clampedX = Math.max(0, Math.min(x, barWidth));
      return clampedX / barWidth;
    },
    [barWidth]
  );

  // Get speaker icon based on volume/mute state
  const getSpeakerIcon = (): 'speaker.slash.fill' | 'speaker.fill' | 'speaker.wave.1.fill' | 'speaker.wave.2.fill' | 'speaker.wave.3.fill' => {
    if (muted || displayVolume === 0) {
      return 'speaker.slash.fill';
    } else if (displayVolume < 0.33) {
      return 'speaker.fill';
    } else if (displayVolume < 0.67) {
      return 'speaker.wave.1.fill';
    } else if (displayVolume < 0.9) {
      return 'speaker.wave.2.fill';
    }
    return 'speaker.wave.3.fill';
  };

  // Toggle mute
  const handleMuteToggle = useCallback(() => {
    onMutedChange(!muted);
  }, [muted, onMutedChange]);

  // Gesture handlers
  const startAdjusting = useCallback(() => {
    setIsAdjusting(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const updateVolume = useCallback((vol: number) => {
    setAdjustedVolume(vol);
  }, []);

  const endAdjusting = useCallback(
    (vol: number) => {
      setIsAdjusting(false);
      onVolumeChange(vol);
      // Unmute if user drags volume up while muted
      if (muted && vol > 0) {
        onMutedChange(false);
      }
      onInteractionEnd?.();
    },
    [onVolumeChange, muted, onMutedChange, onInteractionEnd]
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      thumbScale.value = withTiming(1.5, { duration: 100 });
      barHeight.value = withTiming(6, { duration: 100 });
      const vol = getVolumeFromPosition(event.x);
      runOnJS(startAdjusting)();
      runOnJS(updateVolume)(vol);
    })
    .onUpdate((event) => {
      const vol = getVolumeFromPosition(event.x);
      runOnJS(updateVolume)(vol);
    })
    .onEnd((event) => {
      thumbScale.value = withTiming(1, { duration: 100 });
      barHeight.value = withTiming(4, { duration: 100 });
      const vol = getVolumeFromPosition(event.x);
      runOnJS(endAdjusting)(vol);
    })
    .onFinalize(() => {
      thumbScale.value = withTiming(1, { duration: 100 });
      barHeight.value = withTiming(4, { duration: 100 });
    });

  // Tap gesture for instant volume set
  const tapGesture = Gesture.Tap().onEnd((event) => {
    const vol = getVolumeFromPosition(event.x);
    onVolumeChange(vol);
    // Unmute if user taps on volume bar while muted
    if (muted && vol > 0) {
      onMutedChange(false);
    }
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

  // Effective display volume (show 0 if muted)
  const effectiveVolume = muted ? 0 : displayVolume;

  return (
    <View style={styles.container}>
      {/* Mute button */}
      <Pressable style={styles.muteButton} onPress={handleMuteToggle}>
        <IconSymbol name={getSpeakerIcon()} size={20} color="#fff" />
      </Pressable>

      {/* Volume slider */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.barContainer} onLayout={handleLayout}>
          <Animated.View style={[styles.progressBackground, barAnimatedStyle]}>
            <View
              style={[
                styles.progressFill,
                { width: `${effectiveVolume * 100}%` },
              ]}
            />
          </Animated.View>

          {/* Thumb indicator */}
          <Animated.View
            style={[
              styles.thumb,
              thumbAnimatedStyle,
              { left: `${effectiveVolume * 100}%` },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barContainer: {
    width: 100, // Fixed width for volume slider
    height: 36, // Touch target
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7, // Center the thumb
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});
