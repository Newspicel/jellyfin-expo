/**
 * Themed Components
 *
 * Platform-aware components that use the unified styling system.
 * These components automatically adapt to iOS Liquid Glass on iOS 26+.
 */

// Glass effect components
export {
  GlassView,
  GlassContainer,
  isLiquidGlassSupported,
  type GlassViewProps,
  type GlassContainerProps,
} from './GlassView';

export {
  GlassCard,
  type GlassCardProps,
  type CardSize,
} from './GlassCard';

// Re-export main themed components for convenience
export { ThemedText, type ThemedTextProps } from '../themed-text';
export { ThemedView, type ThemedViewProps } from '../themed-view';
