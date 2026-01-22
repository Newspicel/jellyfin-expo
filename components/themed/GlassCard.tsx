/**
 * GlassCard - Card component with glass effect styling
 *
 * Combines GlassView with card-like padding and styling.
 * Perfect for content cards, media items, and modal content.
 */

import React from 'react';
import {
  StyleSheet,
  Pressable,
  type ViewStyle,
  type PressableProps,
} from 'react-native';

import { GlassView, type GlassViewProps } from './GlassView';
import { useTheme } from '@/theme/useTheme';
import { spacing, radii, shadows } from '@/theme/tokens';

// =============================================================================
// TYPES
// =============================================================================

export type CardSize = 'sm' | 'md' | 'lg';

export interface GlassCardProps extends Omit<GlassViewProps, 'glassStyle'> {
  /**
   * Card size preset (affects padding)
   * @default 'md'
   */
  size?: CardSize;

  /**
   * Whether the card is pressable
   * @default false
   */
  pressable?: boolean;

  /**
   * Callback when the card is pressed (only if pressable)
   */
  onPress?: PressableProps['onPress'];

  /**
   * Whether to show a shadow
   * @default true
   */
  shadow?: boolean;

  /**
   * Custom padding override
   */
  padding?: number;

  children?: React.ReactNode;
  style?: ViewStyle;
}

// =============================================================================
// SIZE PRESETS
// =============================================================================

const sizePresets: Record<CardSize, { padding: number; radius: number }> = {
  sm: { padding: spacing.sm, radius: radii.md },
  md: { padding: spacing.lg, radius: radii.lg },
  lg: { padding: spacing['2xl'], radius: radii.xl },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function GlassCard({
  size = 'md',
  pressable = false,
  onPress,
  shadow = true,
  padding,
  children,
  style,
  borderRadius,
  ...glassProps
}: GlassCardProps) {
  const { isDark } = useTheme();
  const preset = sizePresets[size];

  const cardStyle: ViewStyle = {
    padding: padding ?? preset.padding,
    ...(shadow ? (isDark ? shadows.md : shadows.sm) : {}),
    ...StyleSheet.flatten(style),
  };

  const resolvedRadius = borderRadius ?? preset.radius;

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        <GlassView
          glassStyle="card"
          borderRadius={resolvedRadius}
          style={cardStyle}
          {...glassProps}
        >
          {children}
        </GlassView>
      </Pressable>
    );
  }

  return (
    <GlassView
      glassStyle="card"
      borderRadius={resolvedRadius}
      style={cardStyle}
      {...glassProps}
    >
      {children}
    </GlassView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  pressable: {
    // Pressable wrapper styles
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

export default GlassCard;
