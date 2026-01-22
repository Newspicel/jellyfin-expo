import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassView } from '@/components/themed/GlassView';
import { useColors, spacing, radii } from '@/theme';

export type BackButtonVariant = 'floating' | 'inline';

export interface BackButtonProps {
  /** Custom press handler (defaults to router.back()) */
  onPress?: () => void;
  /** Override the top position (only applies to floating variant) */
  topOffset?: number;
  /** Button variant: 'floating' for detail screens, 'inline' for headers */
  variant?: BackButtonVariant;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * Back button with liquid glass design.
 *
 * Variants:
 * - 'floating': Positioned absolutely in the top-left with safe area insets (for detail screens)
 * - 'inline': Normal flow positioning for headers
 */
export function BackButton({
  onPress,
  topOffset,
  variant = 'floating',
  style,
}: BackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const top = topOffset ?? insets.top + spacing.sm;
  const isFloating = variant === 'floating';

  return (
    <Pressable
      style={[
        styles.pressable,
        isFloating && styles.floatingContainer,
        isFloating && { top },
        style,
      ]}
      onPress={handlePress}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    >
      {({ pressed }) => (
        <GlassView
          glassStyle="clear"
          borderRadius="full"
          style={StyleSheet.flatten([
            styles.button,
            { opacity: pressed ? 0.7 : 1 },
          ])}
        >
          <IconSymbol
            name="chevron.left"
            size={22}
            color={colors.text.primary}
            weight="semibold"
          />
        </GlassView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    // Base pressable styles
  },
  floatingContainer: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
