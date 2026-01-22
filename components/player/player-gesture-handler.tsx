/**
 * Player Gesture Handler
 *
 * Handles tap and double-tap gestures for the video player.
 * - Single tap anywhere: toggle controls visibility
 * - Double tap left third: seek backward 10s
 * - Double tap right third: seek forward 30s
 */

import { useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

export interface PlayerGestureHandlerProps {
  /** Called on single tap (toggle controls) */
  onTap: () => void;
  /** Called on double tap in left zone (-10s) */
  onDoubleTapLeft: () => void;
  /** Called on double tap in right zone (+30s) */
  onDoubleTapRight: () => void;
  /** Children to render (video view) */
  children: React.ReactNode;
  /** Whether gestures are enabled */
  enabled?: boolean;
}

// Screen zones for double-tap detection
const ZONE_LEFT = 0.33;
const ZONE_RIGHT = 0.67;

// Animation timing
const RIPPLE_DURATION = 300;
const RIPPLE_SIZE = 100;

type TapZone = 'left' | 'center' | 'right';

function getZone(x: number, width: number): TapZone {
  const ratio = x / width;
  if (ratio < ZONE_LEFT) return 'left';
  if (ratio > ZONE_RIGHT) return 'right';
  return 'center';
}

export function PlayerGestureHandler({
  onTap,
  onDoubleTapLeft,
  onDoubleTapRight,
  children,
  enabled = true,
}: PlayerGestureHandlerProps) {
  const containerWidth = useRef(Dimensions.get('window').width);

  // Ripple animation state
  const leftRippleOpacity = useSharedValue(0);
  const leftRippleScale = useSharedValue(0.5);
  const rightRippleOpacity = useSharedValue(0);
  const rightRippleScale = useSharedValue(0.5);

  const showLeftRipple = useCallback(() => {
    'worklet';
    leftRippleOpacity.value = withSequence(
      withTiming(0.4, { duration: 50 }),
      withTiming(0, { duration: RIPPLE_DURATION })
    );
    leftRippleScale.value = withSequence(
      withTiming(0.5, { duration: 0 }),
      withTiming(1.5, { duration: RIPPLE_DURATION })
    );
  }, [leftRippleOpacity, leftRippleScale]);

  const showRightRipple = useCallback(() => {
    'worklet';
    rightRippleOpacity.value = withSequence(
      withTiming(0.4, { duration: 50 }),
      withTiming(0, { duration: RIPPLE_DURATION })
    );
    rightRippleScale.value = withSequence(
      withTiming(0.5, { duration: 0 }),
      withTiming(1.5, { duration: RIPPLE_DURATION })
    );
  }, [rightRippleOpacity, rightRippleScale]);

  // Single tap gesture
  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(onTap)();
    });

  // Double tap gesture with zone detection
  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onEnd((event) => {
      const zone = getZone(event.x, containerWidth.current);

      if (zone === 'left') {
        showLeftRipple();
        runOnJS(onDoubleTapLeft)();
      } else if (zone === 'right') {
        showRightRipple();
        runOnJS(onDoubleTapRight)();
      }
      // Center zone double-tap does nothing (just toggle from single tap)
    });

  // Compose gestures - double tap takes precedence
  const composed = Gesture.Exclusive(doubleTap, singleTap);

  // Animated styles for ripple effects
  const leftRippleStyle = useAnimatedStyle(() => ({
    opacity: leftRippleOpacity.value,
    transform: [{ scale: leftRippleScale.value }],
  }));

  const rightRippleStyle = useAnimatedStyle(() => ({
    opacity: rightRippleOpacity.value,
    transform: [{ scale: rightRippleScale.value }],
  }));

  const handleLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    containerWidth.current = event.nativeEvent.layout.width;
  }, []);

  if (!enabled) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.container} onLayout={handleLayout}>
          {children}

          {/* Left ripple indicator */}
          <Animated.View
            style={[styles.ripple, styles.leftRipple, leftRippleStyle]}
            pointerEvents="none"
          />

          {/* Right ripple indicator */}
          <Animated.View
            style={[styles.ripple, styles.rightRipple, rightRippleStyle]}
            pointerEvents="none"
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    marginTop: -RIPPLE_SIZE / 2,
  },
  leftRipple: {
    left: '16%',
    marginLeft: -RIPPLE_SIZE / 2,
  },
  rightRipple: {
    right: '16%',
    marginRight: -RIPPLE_SIZE / 2,
  },
});
