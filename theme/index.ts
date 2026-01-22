/**
 * Unified Styling System for Jellyfin Expo
 *
 * This module exports the complete theming infrastructure including:
 * - Design tokens (spacing, colors, typography, shadows)
 * - Platform detection utilities
 * - Glass effect configurations
 * - Theme hooks
 *
 * @example
 * ```tsx
 * import { useTheme, spacing, colors, isTV, GlassView } from '@/theme';
 *
 * function MyComponent() {
 *   const { colors, isDark, platform } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background.primary }}>
 *       {platform.liquidGlass && <GlassView glassStyle="card" />}
 *     </View>
 *   );
 * }
 * ```
 */

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export {
  // Spacing
  spacing,
  type Spacing,
  // Border radius
  radii,
  type Radii,
  // Typography
  fontSizes,
  type FontSize,
  fontWeights,
  type FontWeight,
  fontFamilies,
  lineHeights,
  // Shadows
  shadows,
  type Shadow,
  // Animation
  animation,
  easing,
  type Animation,
  // Layout
  zIndices,
  type ZIndex,
  sizes,
  type Size,
  opacity,
  aspectRatios,
  type AspectRatio,
  breakpoints,
  type Breakpoint,
} from './tokens';

// =============================================================================
// COLORS
// =============================================================================

export {
  // Color objects
  brand,
  palette,
  colors,
  lightColors,
  darkColors,
  // Helpers
  getColors,
  // Types
  type ColorScheme,
  type SemanticColors,
} from './colors';

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

export {
  // Platform flags
  isIOS,
  isAndroid,
  isWeb,
  isMacOS,
  isWindows,
  isTV,
  isAppleTV,
  isAndroidTV,
  isMobile,
  isDesktop,
  // Version detection
  getIOSVersion,
  getAndroidAPILevel,
  isIOSLiquidGlassSupported,
  isAndroidMaterialYouSupported,
  // Capabilities
  getPlatformCapabilities,
  getPlatformInfo,
  selectPlatform,
  // Types
  type PlatformCapabilities,
  type PlatformInfo,
} from './platform';

// =============================================================================
// GLASS EFFECTS
// =============================================================================

export {
  // Configuration
  getGlassConfig,
  glassContainerSpacing,
  // Availability checks
  isLiquidGlassAvailable,
  isGlassEffectAvailable,
  // Types
  type GlassStyle,
  type GlassConfig,
} from './glass';

// =============================================================================
// THEME HOOKS
// =============================================================================

export {
  // Main hook
  useTheme,
  // Individual hooks for optimized re-renders
  useColorScheme,
  useColors,
  useIsDark,
  usePlatformCapabilities,
  // Static access
  getTheme,
  getColor,
  // Types
  type Theme,
} from './useTheme';

// =============================================================================
// NOTE: Themed components are exported from '@/components/themed'
// to avoid circular dependencies. Import them directly:
//
// import { GlassView, GlassContainer } from '@/components/themed/GlassView';
// =============================================================================
