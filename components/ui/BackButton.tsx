import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors, spacing, radii } from '@/theme';

export interface BackButtonProps {
  /** Custom press handler (defaults to router.back()) */
  onPress?: () => void;
  /** Override the top position (defaults to insets.top + 8) */
  topOffset?: number;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * Floating back button for detail screens.
 * Positioned absolutely in the top-left with safe area insets.
 */
export function BackButton({ onPress, topOffset, style }: BackButtonProps) {
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

  return (
    <Pressable
      style={[styles.container, { top }, style]}
      onPress={handlePress}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    >
      {({ pressed }) => (
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.overlay.dark,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={handlePress}
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
