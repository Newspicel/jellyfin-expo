/**
 * Color system for Jellyfin Expo
 * Supports light mode, dark mode, and iOS Liquid Glass effects
 */

// =============================================================================
// BRAND COLORS
// Jellyfin brand identity
// =============================================================================

export const brand = {
  /** Jellyfin primary blue */
  primary: '#00a4dc',
  /** Jellyfin purple accent */
  secondary: '#aa5cc3',
  /** Gradient start */
  gradientStart: '#00a4dc',
  /** Gradient end */
  gradientEnd: '#aa5cc3',
} as const;

// =============================================================================
// PALETTE
// Raw color values - use semantic colors in components
// =============================================================================

export const palette = {
  // Grayscale
  white: '#ffffff',
  black: '#000000',

  // Gray scale (Apple-inspired)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Blue
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Jellyfin Blue (brand color variations)
  jellyfin: {
    50: '#e6f7fc',
    100: '#b3e7f5',
    200: '#80d7ee',
    300: '#4dc7e7',
    400: '#1ab7e0',
    500: '#00a4dc', // Primary brand color
    600: '#0093c6',
    700: '#0082b0',
    800: '#00719a',
    900: '#005074',
  },

  // Purple
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#aa5cc3', // Secondary brand color
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Red (errors, destructive)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Green (success)
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Yellow/Amber (warnings)
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
} as const;

// =============================================================================
// SEMANTIC COLORS - LIGHT MODE
// =============================================================================

export const lightColors = {
  // Backgrounds
  background: {
    /** Main app background */
    primary: palette.white,
    /** Secondary surfaces (cards) */
    secondary: palette.gray[50],
    /** Tertiary surfaces (nested content) */
    tertiary: palette.gray[100],
    /** Elevated surfaces */
    elevated: palette.white,
    /** Inverted (for contrast) */
    inverse: palette.gray[900],
  },

  // Text
  text: {
    /** Primary text */
    primary: palette.gray[900],
    /** Secondary/muted text */
    secondary: palette.gray[600],
    /** Tertiary/disabled text */
    tertiary: palette.gray[400],
    /** Inverse text (on dark backgrounds) */
    inverse: palette.white,
    /** Link text */
    link: brand.primary,
  },

  // Borders
  border: {
    /** Default border */
    default: palette.gray[200],
    /** Subtle border */
    subtle: palette.gray[100],
    /** Strong border */
    strong: palette.gray[300],
    /** Focus ring */
    focus: brand.primary,
  },

  // Interactive elements
  interactive: {
    /** Primary action (buttons, links) */
    primary: brand.primary,
    /** Primary hover */
    primaryHover: palette.jellyfin[600],
    /** Primary pressed */
    primaryPressed: palette.jellyfin[700],
    /** Secondary action */
    secondary: palette.gray[100],
    /** Secondary hover */
    secondaryHover: palette.gray[200],
    /** Disabled state */
    disabled: palette.gray[300],
  },

  // Status colors
  status: {
    success: palette.green[500],
    successBackground: palette.green[50],
    warning: palette.amber[500],
    warningBackground: palette.amber[50],
    error: palette.red[500],
    errorBackground: palette.red[50],
    info: palette.blue[500],
    infoBackground: palette.blue[50],
  },

  // Media-specific
  media: {
    /** Watched indicator */
    watched: brand.primary,
    /** Progress bar */
    progress: brand.primary,
    /** Progress bar background */
    progressBackground: palette.gray[300],
    /** Unwatched badge */
    unwatched: palette.red[500],
    /** Favorite/heart */
    favorite: palette.red[500],
    /** Rating star */
    rating: palette.amber[400],
  },

  // Overlays
  overlay: {
    /** Light overlay */
    light: 'rgba(255, 255, 255, 0.8)',
    /** Medium overlay */
    medium: 'rgba(255, 255, 255, 0.5)',
    /** Dark overlay (for text on images) */
    dark: 'rgba(0, 0, 0, 0.4)',
    /** Scrim (modal backdrop) */
    scrim: 'rgba(0, 0, 0, 0.5)',
  },

  // Navigation
  nav: {
    /** Active tab/item */
    active: brand.primary,
    /** Inactive tab/item */
    inactive: palette.gray[500],
    /** Tab bar background */
    tabBar: palette.white,
    /** Navigation bar background */
    navBar: palette.white,
  },

  // Glass effect tints (for iOS Liquid Glass)
  glass: {
    /** Default glass tint */
    tint: 'rgba(255, 255, 255, 0.7)',
    /** Glass background */
    background: 'rgba(255, 255, 255, 0.6)',
    /** Glass border */
    border: 'rgba(255, 255, 255, 0.3)',
  },
} as const;

// =============================================================================
// SEMANTIC COLORS - DARK MODE
// =============================================================================

export const darkColors = {
  // Backgrounds
  background: {
    primary: palette.black,
    secondary: palette.gray[900],
    tertiary: palette.gray[800],
    elevated: palette.gray[900],
    inverse: palette.white,
  },

  // Text
  text: {
    primary: palette.gray[50],
    secondary: palette.gray[400],
    tertiary: palette.gray[500],
    inverse: palette.gray[900],
    link: palette.jellyfin[400],
  },

  // Borders
  border: {
    default: palette.gray[700],
    subtle: palette.gray[800],
    strong: palette.gray[600],
    focus: palette.jellyfin[400],
  },

  // Interactive elements
  interactive: {
    primary: palette.jellyfin[400],
    primaryHover: palette.jellyfin[300],
    primaryPressed: palette.jellyfin[500],
    secondary: palette.gray[800],
    secondaryHover: palette.gray[700],
    disabled: palette.gray[700],
  },

  // Status colors (slightly adjusted for dark mode)
  status: {
    success: palette.green[400],
    successBackground: 'rgba(34, 197, 94, 0.15)',
    warning: palette.amber[400],
    warningBackground: 'rgba(245, 158, 11, 0.15)',
    error: palette.red[400],
    errorBackground: 'rgba(239, 68, 68, 0.15)',
    info: palette.blue[400],
    infoBackground: 'rgba(59, 130, 246, 0.15)',
  },

  // Media-specific
  media: {
    watched: palette.jellyfin[400],
    progress: palette.jellyfin[400],
    progressBackground: palette.gray[700],
    unwatched: palette.red[400],
    favorite: palette.red[400],
    rating: palette.amber[400],
  },

  // Overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.05)',
    dark: 'rgba(0, 0, 0, 0.6)',
    scrim: 'rgba(0, 0, 0, 0.7)',
  },

  // Navigation
  nav: {
    active: palette.white,
    inactive: palette.gray[500],
    tabBar: palette.gray[900],
    navBar: palette.gray[900],
  },

  // Glass effect tints (for iOS Liquid Glass - dark mode)
  glass: {
    tint: 'rgba(0, 0, 0, 0.5)',
    background: 'rgba(30, 30, 30, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

// =============================================================================
// COLOR SCHEMES TYPE
// =============================================================================

export type ColorScheme = 'light' | 'dark';

/**
 * Semantic color structure (shared between light and dark modes)
 * Using a more flexible type that works for both schemes
 */
export interface SemanticColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    link: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string;
  };
  interactive: {
    primary: string;
    primaryHover: string;
    primaryPressed: string;
    secondary: string;
    secondaryHover: string;
    disabled: string;
  };
  status: {
    success: string;
    successBackground: string;
    warning: string;
    warningBackground: string;
    error: string;
    errorBackground: string;
    info: string;
    infoBackground: string;
  };
  media: {
    watched: string;
    progress: string;
    progressBackground: string;
    unwatched: string;
    favorite: string;
    rating: string;
  };
  overlay: {
    light: string;
    medium: string;
    dark: string;
    scrim: string;
  };
  nav: {
    active: string;
    inactive: string;
    tabBar: string;
    navBar: string;
  };
  glass: {
    tint: string;
    background: string;
    border: string;
  };
}

export const colors = {
  light: lightColors,
  dark: darkColors,
  brand,
  palette,
} as const;

// =============================================================================
// HELPER: Get colors for scheme
// =============================================================================

export function getColors(scheme: ColorScheme): SemanticColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
