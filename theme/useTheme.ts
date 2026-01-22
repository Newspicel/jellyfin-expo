/**
 * Theme hook for accessing the unified styling system
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

import {
  colors,
  getColors,
  type ColorScheme,
  type SemanticColors,
} from './colors';
import { getPlatformCapabilities, type PlatformCapabilities } from './platform';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  fontFamilies,
  shadows,
  animation,
  sizes,
  opacity,
  aspectRatios,
} from './tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface Theme {
  /** Current color scheme */
  colorScheme: ColorScheme;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Semantic colors for the current scheme */
  colors: SemanticColors;
  /** Brand colors (always the same) */
  brand: typeof colors.brand;
  /** Raw palette colors */
  palette: typeof colors.palette;
  /** Spacing scale */
  spacing: typeof spacing;
  /** Border radius scale */
  radii: typeof radii;
  /** Font sizes */
  fontSizes: typeof fontSizes;
  /** Font weights */
  fontWeights: typeof fontWeights;
  /** Font families */
  fontFamilies: typeof fontFamilies;
  /** Shadow presets */
  shadows: typeof shadows;
  /** Animation durations */
  animation: typeof animation;
  /** Component sizes */
  sizes: typeof sizes;
  /** Opacity scale */
  opacity: typeof opacity;
  /** Aspect ratios for media */
  aspectRatios: typeof aspectRatios;
  /** Platform capabilities */
  platform: PlatformCapabilities;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access the unified theme system
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { colors, spacing, isDark, platform } = useTheme();
 *
 *   return (
 *     <View style={{
 *       backgroundColor: colors.background.primary,
 *       padding: spacing.lg,
 *     }}>
 *       {platform.liquidGlass && <GlassView />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme(): Theme {
  const colorScheme = useRNColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const semanticColors = getColors(colorScheme);
  const platformCapabilities = getPlatformCapabilities();

  return {
    colorScheme,
    isDark,
    colors: semanticColors,
    brand: colors.brand,
    palette: colors.palette,
    spacing,
    radii,
    fontSizes,
    fontWeights,
    fontFamilies,
    shadows,
    animation,
    sizes,
    opacity,
    aspectRatios,
    platform: platformCapabilities,
  };
}

// =============================================================================
// STATIC ACCESS (for non-component code)
// =============================================================================

/**
 * Get theme values statically (without hook)
 * Use useTheme() in components for reactivity
 */
export function getTheme(colorScheme: ColorScheme = 'light'): Theme {
  const isDark = colorScheme === 'dark';
  const semanticColors = getColors(colorScheme);
  const platformCapabilities = getPlatformCapabilities();

  return {
    colorScheme,
    isDark,
    colors: semanticColors,
    brand: colors.brand,
    palette: colors.palette,
    spacing,
    radii,
    fontSizes,
    fontWeights,
    fontFamilies,
    shadows,
    animation,
    sizes,
    opacity,
    aspectRatios,
    platform: platformCapabilities,
  };
}

// =============================================================================
// INDIVIDUAL HOOKS (for optimized re-renders)
// =============================================================================

/**
 * Hook to get just the color scheme
 */
export function useColorScheme(): ColorScheme {
  return useRNColorScheme() ?? 'light';
}

/**
 * Hook to get just the semantic colors
 */
export function useColors(): SemanticColors {
  const colorScheme = useRNColorScheme() ?? 'light';
  return getColors(colorScheme);
}

/**
 * Hook to check if dark mode is active
 */
export function useIsDark(): boolean {
  return (useRNColorScheme() ?? 'light') === 'dark';
}

/**
 * Hook to get platform capabilities
 */
export function usePlatformCapabilities(): PlatformCapabilities {
  return getPlatformCapabilities();
}

// =============================================================================
// TYPED COLOR GETTER
// =============================================================================

type ColorPath = string;

/**
 * Get a specific color value by path
 *
 * @example
 * ```ts
 * const bg = getColor('background.primary', 'dark'); // Returns dark mode background
 * ```
 */
export function getColor(path: ColorPath, scheme: ColorScheme = 'light'): string {
  const semanticColors = getColors(scheme);
  const parts = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = semanticColors;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Color path "${path}" not found`);
      return '#ff00ff'; // Magenta for missing colors (easy to spot)
    }
  }

  return current as string;
}
