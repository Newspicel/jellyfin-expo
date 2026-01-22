/**
 * Glass effect configuration for Jellyfin Expo
 * Supports iOS 26+ Liquid Glass and fallback blur effects
 */

import type { BlurTint } from 'expo-blur';

import { isIOS, isAppleTV, isIOSLiquidGlassSupported } from './platform';

// =============================================================================
// GLASS EFFECT TYPES
// =============================================================================

/**
 * Glass effect styles following Apple's Liquid Glass design language
 */
export type GlassStyle =
  | 'clear' // Transparent with subtle glass effect
  | 'regular' // Standard glass with medium tint
  | 'prominent' // Stronger glass effect for emphasis
  | 'navigation' // Optimized for navigation bars
  | 'tabBar' // Optimized for tab bars
  | 'card' // Optimized for card surfaces
  | 'modal' // Optimized for modal sheets
  | 'player'; // Optimized for media player overlays

/**
 * Configuration for glass effects
 */
export interface GlassConfig {
  /** Whether to use native Liquid Glass (iOS 26+) */
  useNativeLiquidGlass: boolean;
  /** The expo-glass-effect style to use */
  liquidGlassStyle: 'clear' | 'regular';
  /** Fallback blur intensity (0-100) */
  blurIntensity: number;
  /** Fallback blur tint */
  blurTint: BlurTint;
  /** Optional tint color for glass */
  tintColor?: string;
  /** Whether the glass is interactive (receives touches) */
  isInteractive: boolean;
}

// =============================================================================
// GLASS CONFIGURATIONS
// =============================================================================

/**
 * Get glass configuration for a given style and color scheme
 */
export function getGlassConfig(
  style: GlassStyle,
  isDark: boolean
): GlassConfig {
  const canUseLiquidGlass = (isIOS || isAppleTV) && isIOSLiquidGlassSupported();

  // Base configuration by style
  const configs: Record<GlassStyle, GlassConfig> = {
    clear: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'clear',
      blurIntensity: 30,
      blurTint: isDark ? 'dark' : 'light',
      isInteractive: true,
    },
    regular: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'regular',
      blurIntensity: 50,
      blurTint: isDark ? 'dark' : 'light',
      isInteractive: true,
    },
    prominent: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'regular',
      blurIntensity: 80,
      blurTint: isDark ? 'prominent' : 'extraLight',
      isInteractive: true,
    },
    navigation: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'regular',
      blurIntensity: 70,
      blurTint: isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
      isInteractive: false,
    },
    tabBar: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'regular',
      blurIntensity: 80,
      blurTint: isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
      isInteractive: false,
    },
    card: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'clear',
      blurIntensity: 40,
      blurTint: isDark ? 'systemMaterialDark' : 'systemMaterialLight',
      isInteractive: true,
    },
    modal: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'regular',
      blurIntensity: 90,
      blurTint: isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight',
      isInteractive: true,
    },
    player: {
      useNativeLiquidGlass: canUseLiquidGlass,
      liquidGlassStyle: 'clear',
      blurIntensity: 60,
      blurTint: 'dark', // Always dark for player (over video content)
      isInteractive: true,
    },
  };

  return configs[style];
}

// =============================================================================
// GLASS EFFECT AVAILABILITY
// =============================================================================

/**
 * Check if native Liquid Glass is available on this device
 */
export function isLiquidGlassAvailable(): boolean {
  return (isIOS || isAppleTV) && isIOSLiquidGlassSupported();
}

/**
 * Check if any glass/blur effects are available
 */
export function isGlassEffectAvailable(): boolean {
  // expo-blur works on iOS, macOS, Android, and Web
  return true;
}

// =============================================================================
// GLASS CONTAINER CONFIGURATIONS
// =============================================================================

/**
 * Spacing values for GlassContainer (when elements should merge)
 */
export const glassContainerSpacing = {
  /** Elements merge when touching */
  tight: 0,
  /** Elements merge when within 4px */
  normal: 4,
  /** Elements merge when within 8px */
  loose: 8,
  /** Elements stay separate (large spacing) */
  separate: 100,
} as const;
