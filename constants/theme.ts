/**
 * Theme constants for Jellyfin Expo
 *
 * This file maintains backwards compatibility with existing code
 * while using the new unified styling system under the hood.
 *
 * For new code, prefer importing from '@/theme' directly:
 * import { useTheme, colors, spacing } from '@/theme';
 */

import { Platform } from 'react-native';

import { colors as themeColors, brand } from '@/theme/colors';

// =============================================================================
// LEGACY COLOR EXPORTS
// Kept for backwards compatibility with existing code
// =============================================================================

const tintColorLight = brand.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: themeColors.light.text.primary,
    background: themeColors.light.background.primary,
    tint: tintColorLight,
    icon: themeColors.light.text.secondary,
    tabIconDefault: themeColors.light.nav.inactive,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: themeColors.dark.text.primary,
    background: themeColors.dark.background.primary,
    tint: tintColorDark,
    icon: themeColors.dark.text.secondary,
    tabIconDefault: themeColors.dark.nav.inactive,
    tabIconSelected: tintColorDark,
  },
};

// =============================================================================
// FONT FAMILIES
// Platform-specific system fonts
// =============================================================================

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// =============================================================================
// RE-EXPORTS FROM NEW THEME SYSTEM
// =============================================================================

export {
  brand,
  palette,
  colors,
  lightColors,
  darkColors,
} from '@/theme/colors';

export {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  shadows,
  animation,
  sizes,
  opacity,
} from '@/theme/tokens';
