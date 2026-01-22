/**
 * ThemedText - Text component with theme-aware styling
 *
 * Uses the unified styling system for consistent typography across the app.
 */

import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { fontSizes, fontWeights, lineHeights } from '@/theme/tokens';

// =============================================================================
// TYPES
// =============================================================================

export type TextVariant =
  | 'body' // Default body text (17px)
  | 'bodySmall' // Smaller body (15px)
  | 'caption' // Caption/footnote (13px)
  | 'label' // Label text (11px)
  | 'title' // Large title (34px)
  | 'title2' // Medium title (28px)
  | 'title3' // Small title (22px)
  | 'headline' // Headline (17px bold)
  | 'subheadline' // Subheadline (15px)
  | 'link'; // Link text

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'link'
  | 'success'
  | 'warning'
  | 'error';

export type ThemedTextProps = TextProps & {
  /** Text variant/style preset */
  variant?: TextVariant;
  /** Semantic color */
  color?: TextColor;
  /** Manual light mode color override */
  lightColor?: string;
  /** Manual dark mode color override */
  darkColor?: string;
  /** Legacy type prop for backwards compatibility */
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

// =============================================================================
// VARIANT STYLES
// =============================================================================

const variantStyles: Record<TextVariant, TextStyle> = {
  body: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  label: {
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  title: {
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
  },
  title2: {
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
  },
  title3: {
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.snug,
    fontWeight: fontWeights.semibold,
  },
  headline: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    fontWeight: fontWeights.semibold,
  },
  subheadline: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  link: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
    fontWeight: fontWeights.regular,
  },
};

// Legacy type mapping
const legacyTypeToVariant: Record<NonNullable<ThemedTextProps['type']>, TextVariant> = {
  default: 'body',
  title: 'title',
  defaultSemiBold: 'headline',
  subtitle: 'title3',
  link: 'link',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ThemedText({
  style,
  variant,
  color = 'primary',
  lightColor,
  darkColor,
  type,
  ...rest
}: ThemedTextProps) {
  const { colors, isDark } = useTheme();

  // Resolve variant (support legacy 'type' prop)
  const resolvedVariant = variant ?? (type ? legacyTypeToVariant[type] : 'body');

  // Resolve color
  let resolvedColor: string;
  if (lightColor || darkColor) {
    // Manual override
    resolvedColor = isDark ? (darkColor ?? lightColor!) : (lightColor ?? darkColor!);
  } else {
    // Semantic color
    switch (color) {
      case 'primary':
        resolvedColor = colors.text.primary;
        break;
      case 'secondary':
        resolvedColor = colors.text.secondary;
        break;
      case 'tertiary':
        resolvedColor = colors.text.tertiary;
        break;
      case 'inverse':
        resolvedColor = colors.text.inverse;
        break;
      case 'link':
        resolvedColor = colors.text.link;
        break;
      case 'success':
        resolvedColor = colors.status.success;
        break;
      case 'warning':
        resolvedColor = colors.status.warning;
        break;
      case 'error':
        resolvedColor = colors.status.error;
        break;
      default:
        resolvedColor = colors.text.primary;
    }
  }

  return (
    <Text
      style={[
        variantStyles[resolvedVariant],
        { color: resolvedColor },
        // Special case: link variant always uses link color unless overridden
        resolvedVariant === 'link' && !lightColor && !darkColor && color === 'primary'
          ? { color: colors.text.link }
          : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

// =============================================================================
// LEGACY STYLES (kept for any external usage)
// =============================================================================

export const styles = StyleSheet.create({
  default: variantStyles.body,
  defaultSemiBold: variantStyles.headline,
  title: variantStyles.title,
  subtitle: variantStyles.title3,
  link: variantStyles.link,
});

export default ThemedText;
