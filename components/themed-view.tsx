/**
 * ThemedView - View component with theme-aware background
 *
 * Uses the unified styling system for consistent backgrounds across the app.
 */

import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

// =============================================================================
// TYPES
// =============================================================================

export type BackgroundVariant =
  | 'primary' // Main app background
  | 'secondary' // Card/surface background
  | 'tertiary' // Nested content background
  | 'elevated' // Elevated surface
  | 'inverse' // Inverted background
  | 'transparent'; // No background

export type ThemedViewProps = ViewProps & {
  /** Background variant */
  background?: BackgroundVariant;
  /** Manual light mode color override */
  lightColor?: string;
  /** Manual dark mode color override */
  darkColor?: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ThemedView({
  style,
  background = 'primary',
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { colors, isDark } = useTheme();

  // Resolve background color
  let backgroundColor: string | undefined;

  if (lightColor || darkColor) {
    // Manual override
    backgroundColor = isDark ? (darkColor ?? lightColor) : (lightColor ?? darkColor);
  } else if (background === 'transparent') {
    backgroundColor = 'transparent';
  } else {
    // Use semantic background colors
    backgroundColor = colors.background[background];
  }

  return <View style={[{ backgroundColor } as ViewStyle, style]} {...otherProps} />;
}

export default ThemedView;
