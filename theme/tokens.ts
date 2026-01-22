/**
 * Design tokens for the Jellyfin Expo app
 * Following Apple's Human Interface Guidelines and Material Design principles
 */

import { Platform } from 'react-native';

// =============================================================================
// SPACING SCALE
// Based on 4px base unit, following Apple's spacing guidelines
// =============================================================================

export const spacing = {
  /** 0px */
  none: 0,
  /** 2px - Micro spacing */
  '2xs': 2,
  /** 4px - Tiny spacing */
  xs: 4,
  /** 8px - Small spacing */
  sm: 8,
  /** 12px - Medium-small spacing */
  md: 12,
  /** 16px - Medium spacing (default) */
  lg: 16,
  /** 20px - Medium-large spacing */
  xl: 20,
  /** 24px - Large spacing */
  '2xl': 24,
  /** 32px - Extra large spacing */
  '3xl': 32,
  /** 40px - Huge spacing */
  '4xl': 40,
  /** 48px - Section spacing */
  '5xl': 48,
  /** 64px - Layout spacing */
  '6xl': 64,
  /** 80px - Hero spacing */
  '7xl': 80,
  /** 96px - Maximum spacing */
  '8xl': 96,
} as const;

// =============================================================================
// BORDER RADIUS
// Following Apple's Liquid Glass continuous corner radius
// =============================================================================

export const radii = {
  /** 0px - No radius */
  none: 0,
  /** 4px - Subtle rounding */
  xs: 4,
  /** 8px - Small rounding */
  sm: 8,
  /** 12px - Medium rounding (buttons, inputs) */
  md: 12,
  /** 16px - Large rounding (cards) */
  lg: 16,
  /** 20px - Extra large rounding */
  xl: 20,
  /** 24px - Huge rounding (modals) */
  '2xl': 24,
  /** 32px - Maximum rounding */
  '3xl': 32,
  /** 9999px - Full/pill rounding */
  full: 9999,
} as const;

// =============================================================================
// TYPOGRAPHY SCALE
// iOS uses SF Pro, Android uses Roboto, we use system fonts
// =============================================================================

export const fontSizes = {
  /** 10px - Caption small */
  '2xs': 10,
  /** 11px - Caption */
  xs: 11,
  /** 13px - Footnote */
  sm: 13,
  /** 15px - Subheadline */
  md: 15,
  /** 17px - Body (iOS default) */
  base: 17,
  /** 20px - Title 3 */
  lg: 20,
  /** 22px - Title 2 */
  xl: 22,
  /** 28px - Title 1 */
  '2xl': 28,
  /** 34px - Large Title */
  '3xl': 34,
  /** 40px - Display */
  '4xl': 40,
  /** 48px - Hero */
  '5xl': 48,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.75,
} as const;

export const fontWeights = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

// =============================================================================
// FONT FAMILIES
// Platform-specific system fonts
// =============================================================================

export const fontFamilies = Platform.select({
  ios: {
    /** SF Pro Display - Default system font */
    sans: 'System',
    /** SF Pro Rounded - Friendly rounded variant */
    rounded: 'System',
    /** SF Mono - Monospace */
    mono: 'Menlo',
    /** New York - Serif */
    serif: 'Georgia',
  },
  android: {
    sans: 'Roboto',
    rounded: 'Roboto',
    mono: 'monospace',
    serif: 'serif',
  },
  default: {
    sans: 'System',
    rounded: 'System',
    mono: 'monospace',
    serif: 'serif',
  },
})!;

// =============================================================================
// SHADOWS
// Following Apple's layered shadow system for depth
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Subtle shadow for cards and surfaces */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  /** Default shadow for interactive elements */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  /** Elevated shadow for modals and popovers */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  /** Strong shadow for floating elements */
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  /** Maximum shadow for focus states */
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

// =============================================================================
// ANIMATION TIMING
// Following Apple's fluid animation guidelines
// =============================================================================

export const animation = {
  /** 100ms - Micro interactions */
  instant: 100,
  /** 150ms - Quick feedback */
  fast: 150,
  /** 250ms - Standard transitions */
  normal: 250,
  /** 350ms - Emphasis transitions */
  slow: 350,
  /** 500ms - Large movements */
  slower: 500,
} as const;

export const easing = {
  /** Standard easing for most animations */
  standard: [0.4, 0.0, 0.2, 1.0] as const,
  /** Decelerate - Items entering screen */
  decelerate: [0.0, 0.0, 0.2, 1.0] as const,
  /** Accelerate - Items leaving screen */
  accelerate: [0.4, 0.0, 1.0, 1.0] as const,
  /** Spring - Playful bounce */
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

export const zIndices = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 9999,
} as const;

// =============================================================================
// OPACITY SCALE
// =============================================================================

export const opacity = {
  transparent: 0,
  /** Barely visible */
  '5': 0.05,
  /** Subtle */
  '10': 0.1,
  /** Light overlay */
  '20': 0.2,
  /** Quarter */
  '25': 0.25,
  /** Medium-light */
  '30': 0.3,
  /** Medium */
  '50': 0.5,
  /** Medium-dark */
  '70': 0.7,
  /** Heavy */
  '80': 0.8,
  /** Near opaque */
  '90': 0.9,
  /** Full */
  full: 1,
} as const;

// =============================================================================
// SIZES (for components like icons, avatars, etc.)
// =============================================================================

export const sizes = {
  /** 16px */
  xs: 16,
  /** 20px */
  sm: 20,
  /** 24px */
  md: 24,
  /** 32px */
  lg: 32,
  /** 40px */
  xl: 40,
  /** 48px */
  '2xl': 48,
  /** 56px */
  '3xl': 56,
  /** 64px */
  '4xl': 64,
  /** 80px */
  '5xl': 80,
  /** 96px */
  '6xl': 96,
} as const;

// =============================================================================
// ASPECT RATIOS (for media)
// =============================================================================

export const aspectRatios = {
  square: 1,
  portrait: 2 / 3, // Standard poster ratio
  landscape: 16 / 9, // Widescreen
  wide: 21 / 9, // Cinematic
  tv: 4 / 3, // Classic TV
} as const;

// =============================================================================
// BREAKPOINTS (for responsive design)
// =============================================================================

export const breakpoints = {
  /** Phone portrait */
  sm: 320,
  /** Phone landscape / Small tablet */
  md: 640,
  /** Tablet */
  lg: 1024,
  /** Desktop / TV */
  xl: 1280,
  /** Large desktop / Large TV */
  '2xl': 1536,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Spacing = keyof typeof spacing;
export type Radii = keyof typeof radii;
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type Shadow = keyof typeof shadows;
export type Animation = keyof typeof animation;
export type ZIndex = keyof typeof zIndices;
export type Size = keyof typeof sizes;
export type AspectRatio = keyof typeof aspectRatios;
export type Breakpoint = keyof typeof breakpoints;
