/**
 * Hook for getting theme-aware colors
 *
 * This hook maintains backwards compatibility while using the new unified styling system.
 * For new code, prefer using the useTheme() hook from '@/theme':
 *
 * @example
 * ```tsx
 * import { useTheme } from '@/theme';
 *
 * function MyComponent() {
 *   const { colors } = useTheme();
 *   return <View style={{ backgroundColor: colors.background.primary }} />;
 * }
 * ```
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Get a theme-aware color value
 *
 * @param props - Optional light/dark color overrides
 * @param colorName - The color key to look up in the theme
 * @returns The resolved color value for the current theme
 *
 * @deprecated Prefer using useTheme() from '@/theme' for new code
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
