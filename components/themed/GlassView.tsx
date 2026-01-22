/**
 * GlassView - Platform-aware glass effect component
 *
 * Uses iOS 26+ Liquid Glass when available, falls back to expo-blur otherwise.
 * Follows Apple's Liquid Glass design guidelines.
 *
 * Important notes from Apple:
 * - The isInteractive prop can only be set once on mount (cannot change dynamically)
 * - Avoid opacity values less than 1 on GlassView or parent views
 */

import { BlurView } from 'expo-blur';
import {
  GlassView as NativeGlassView,
  GlassContainer as NativeGlassContainer,
  isLiquidGlassAvailable as checkLiquidGlassAvailable,
} from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { type GlassStyle, getGlassConfig } from '@/theme/glass';
import { radii } from '@/theme/tokens';

// =============================================================================
// AVAILABILITY CHECK
// =============================================================================

/**
 * Check if native Liquid Glass is available and safe to use
 * Uses isLiquidGlassAvailable from expo-glass-effect which checks:
 * - iOS version (26+)
 * - Correct compiler/build settings
 * - Info.plist configuration
 */
function canUseNativeLiquidGlass(): boolean {
  try {
    return checkLiquidGlassAvailable();
  } catch {
    // If anything throws, glass effect is not available
    return false;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface GlassViewProps extends ViewProps {
  /**
   * The glass effect style to use
   * @default 'regular'
   */
  glassStyle?: GlassStyle;

  /**
   * Custom tint color for the glass effect
   * Only applies to native Liquid Glass on iOS 26+
   */
  tintColor?: string;

  /**
   * Border radius for the glass view
   * @default 'lg'
   */
  borderRadius?: keyof typeof radii | number;

  /**
   * Whether the glass view can receive touch events
   * Note: On iOS 26+ Liquid Glass, this cannot be changed after mount!
   * If you need to toggle, remount with a different `key` prop.
   * @default true
   */
  interactive?: boolean;

  /**
   * Children to render inside the glass view
   */
  children?: React.ReactNode;

  /**
   * Style for the glass container
   * IMPORTANT: Avoid setting opacity < 1 on this or parent views
   */
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GlassView({
  glassStyle = 'regular',
  tintColor,
  borderRadius = 'lg',
  interactive = true,
  children,
  style,
  ...viewProps
}: GlassViewProps) {
  const { isDark } = useTheme();
  const config = getGlassConfig(glassStyle, isDark);

  // Resolve border radius
  const resolvedRadius =
    typeof borderRadius === 'number' ? borderRadius : radii[borderRadius];

  // Common style with border radius
  const containerStyle: ViewStyle = {
    borderRadius: resolvedRadius,
    overflow: 'hidden',
    ...StyleSheet.flatten(style),
  };

  // Check if we can use native Liquid Glass
  const useNativeGlass = canUseNativeLiquidGlass() && config.useNativeLiquidGlass;

  // Use native Liquid Glass on iOS 26+
  if (useNativeGlass) {
    return (
      <NativeGlassView
        style={containerStyle}
        glassEffectStyle={config.liquidGlassStyle}
        tintColor={tintColor ?? config.tintColor}
        isInteractive={interactive && config.isInteractive}
        {...viewProps}
      >
        {children}
      </NativeGlassView>
    );
  }

  // Fallback to BlurView for other platforms (iOS < 26, Android, Web, etc.)
  return (
    <View style={containerStyle} {...viewProps}>
      <BlurView
        intensity={config.blurIntensity}
        tint={config.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

// =============================================================================
// GLASS CONTAINER (for grouping glass elements)
// =============================================================================

export interface GlassContainerProps extends ViewProps {
  /**
   * Spacing that controls when glass elements merge together
   * Only applies on iOS 26+ with native Liquid Glass
   * @default 4
   */
  spacing?: number;

  children?: React.ReactNode;
}

export function GlassContainer({
  spacing = 4,
  children,
  style,
  ...viewProps
}: GlassContainerProps) {
  const useNativeContainer = canUseNativeLiquidGlass();

  if (useNativeContainer) {
    return (
      <NativeGlassContainer spacing={spacing} style={style} {...viewProps}>
        {children}
      </NativeGlassContainer>
    );
  }

  // Fallback: just a regular View (children handle their own glass effects)
  return (
    <View style={style} {...viewProps}>
      {children}
    </View>
  );
}

// =============================================================================
// UTILITY: Check if liquid glass is available
// =============================================================================

export { canUseNativeLiquidGlass as isLiquidGlassSupported };

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export default GlassView;
