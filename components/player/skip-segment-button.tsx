/**
 * SkipSegmentButton - Button to skip intro, outro, or other media segments
 *
 * Displays an animated skip button when playback is within a skippable segment.
 * The button shows the segment type (e.g., "Skip Intro") and auto-hides after
 * the segment ends.
 */

import { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';

import { IconSymbol } from '@/components/ui';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';
import type { MediaSegment } from '@/hooks/use-media-segments';
import { getSegmentLabel } from '@/hooks/use-media-segments';

// =============================================================================
// TYPES
// =============================================================================

export interface SkipSegmentButtonProps {
  /** The currently active segment to skip, or null if none */
  segment: MediaSegment | null;
  /** Called when the user presses the skip button */
  onSkip: (endTimeSeconds: number) => void;
  /** Whether the controls are currently visible (affects position) */
  controlsVisible?: boolean;
  /** Bottom offset when controls are hidden */
  bottomOffsetHidden?: number;
  /** Bottom offset when controls are visible */
  bottomOffsetVisible?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

// Default bottom offsets
const DEFAULT_BOTTOM_HIDDEN = 40;
const DEFAULT_BOTTOM_VISIBLE = 100;

export function SkipSegmentButton({
  segment,
  onSkip,
  controlsVisible = true,
  bottomOffsetHidden = DEFAULT_BOTTOM_HIDDEN,
  bottomOffsetVisible = DEFAULT_BOTTOM_VISIBLE,
}: SkipSegmentButtonProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  // Use translateY instead of bottom to keep all animations on native driver
  // We animate relative to the "visible" position, so 0 = visible, positive = hidden (moved down)
  const translateYAnim = useRef(new Animated.Value(bottomOffsetVisible - bottomOffsetHidden)).current;

  // Animate in when segment becomes active
  useEffect(() => {
    if (segment) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [segment, fadeAnim, slideAnim]);

  // Animate vertical position based on controls visibility
  // translateY 0 = at bottomOffsetVisible position, positive = moved down toward bottomOffsetHidden
  useEffect(() => {
    Animated.timing(translateYAnim, {
      toValue: controlsVisible ? 0 : bottomOffsetVisible - bottomOffsetHidden,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, bottomOffsetHidden, bottomOffsetVisible, translateYAnim]);

  const handleSkip = useCallback(() => {
    if (segment) {
      onSkip(segment.endSeconds);
    }
  }, [segment, onSkip]);

  // Don't render if no segment
  if (!segment) {
    return null;
  }

  const label = getSegmentLabel(segment.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { translateY: translateYAnim }],
          bottom: bottomOffsetVisible,
        },
      ]}
      pointerEvents={segment ? 'auto' : 'none'}
    >
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSkip}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.iconContainer}>
          <IconSymbol name="forward.fill" size={14} color="#000" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    // bottom is set dynamically via animation
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radii.lg,
    gap: spacing.sm,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: '#000',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SkipSegmentButton;
