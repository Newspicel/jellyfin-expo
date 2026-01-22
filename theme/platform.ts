/**
 * Platform detection utilities for Jellyfin Expo
 * Helps determine platform-specific behavior and styling
 */

import { Platform } from 'react-native';

// =============================================================================
// PLATFORM FLAGS
// =============================================================================

/** Whether we're running on iOS (phone/tablet) */
export const isIOS = Platform.OS === 'ios';

/** Whether we're running on Android (phone/tablet) */
export const isAndroid = Platform.OS === 'android';

/** Whether we're running on web */
export const isWeb = Platform.OS === 'web';

/** Whether we're running on macOS (Catalyst) */
export const isMacOS = Platform.OS === 'macos';

/** Whether we're running on Windows */
export const isWindows = Platform.OS === 'windows';

/** Whether we're running on a TV platform (Apple TV or Android TV) */
export const isTV = Platform.isTV === true;

/** Whether we're running on Apple TV specifically */
export const isAppleTV = isTV && isIOS;

/** Whether we're running on Android TV specifically */
export const isAndroidTV = isTV && isAndroid;

/** Whether we're running on a mobile device (non-TV) */
export const isMobile = (isIOS || isAndroid) && !isTV;

/** Whether we're running on a desktop platform */
export const isDesktop = isMacOS || isWindows || isWeb;

// =============================================================================
// iOS VERSION DETECTION
// =============================================================================

/**
 * Get the iOS version number (or null if not iOS)
 */
export function getIOSVersion(): number | null {
  if (!isIOS) return null;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseFloat(version);
  }
  return version as number;
}

/**
 * Check if running iOS 26 or later (required for Liquid Glass)
 */
export function isIOSLiquidGlassSupported(): boolean {
  const version = getIOSVersion();
  return version !== null && version >= 26;
}

// =============================================================================
// ANDROID VERSION DETECTION
// =============================================================================

/**
 * Get the Android API level (or null if not Android)
 */
export function getAndroidAPILevel(): number | null {
  if (!isAndroid) return null;
  return Platform.Version as number;
}

/**
 * Check if running Android 12 or later (required for Material You)
 */
export function isAndroidMaterialYouSupported(): boolean {
  const version = getAndroidAPILevel();
  return version !== null && version >= 31; // Android 12 is API 31
}

// =============================================================================
// PLATFORM CAPABILITIES
// =============================================================================

export interface PlatformCapabilities {
  /** Whether the platform supports liquid glass effects */
  liquidGlass: boolean;
  /** Whether the platform supports Material You dynamic colors */
  materialYou: boolean;
  /** Whether the platform uses TV-style navigation (D-pad, focus) */
  tvNavigation: boolean;
  /** Whether the platform supports haptic feedback */
  haptics: boolean;
  /** Whether the platform supports blur effects */
  blur: boolean;
  /** Whether the platform is touch-based */
  touch: boolean;
  /** Whether the platform supports picture-in-picture */
  pip: boolean;
  /** Whether the platform supports system dark mode */
  systemDarkMode: boolean;
}

/**
 * Get the capabilities of the current platform
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  return {
    liquidGlass: isIOSLiquidGlassSupported() || (isAppleTV && isIOSLiquidGlassSupported()),
    materialYou: isAndroidMaterialYouSupported(),
    tvNavigation: isTV,
    haptics: isIOS || isAndroid,
    blur: isIOS || isMacOS || isAppleTV,
    touch: isMobile,
    pip: isIOS || isAndroid,
    systemDarkMode: true, // All modern platforms support this
  };
}

// =============================================================================
// PLATFORM-SPECIFIC VALUES
// =============================================================================

type PlatformValues<T> = {
  ios?: T;
  android?: T;
  tv?: T;
  appleTV?: T;
  androidTV?: T;
  web?: T;
  macos?: T;
  windows?: T;
  default: T;
};

/**
 * Select a value based on the current platform
 * More granular than React Native's Platform.select
 */
export function selectPlatform<T>(values: PlatformValues<T>): T {
  // Most specific first
  if (isAppleTV && values.appleTV !== undefined) return values.appleTV;
  if (isAndroidTV && values.androidTV !== undefined) return values.androidTV;
  if (isTV && values.tv !== undefined) return values.tv;
  if (isIOS && values.ios !== undefined) return values.ios;
  if (isAndroid && values.android !== undefined) return values.android;
  if (isWeb && values.web !== undefined) return values.web;
  if (isMacOS && values.macos !== undefined) return values.macos;
  if (isWindows && values.windows !== undefined) return values.windows;

  return values.default;
}

// =============================================================================
// PLATFORM INFO FOR DEBUGGING
// =============================================================================

export interface PlatformInfo {
  os: string;
  version: string | number;
  isTV: boolean;
  capabilities: PlatformCapabilities;
}

export function getPlatformInfo(): PlatformInfo {
  return {
    os: Platform.OS,
    version: Platform.Version,
    isTV,
    capabilities: getPlatformCapabilities(),
  };
}
