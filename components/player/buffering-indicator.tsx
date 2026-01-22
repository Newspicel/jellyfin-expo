/**
 * Buffering Indicator
 *
 * Centered loading spinner with semi-transparent background.
 * Displayed when video is buffering.
 */

import { StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export interface BufferingIndicatorProps {
  /** Whether the indicator should be visible */
  visible: boolean;
}

export function BufferingIndicator({ visible }: BufferingIndicatorProps) {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Don't render if not visible (saves resources)
  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <ActivityIndicator size="large" color="#fff" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
