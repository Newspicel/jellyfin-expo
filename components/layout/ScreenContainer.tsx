import { ReactNode } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { useColors, spacing } from '@/theme';

export interface ScreenContainerProps {
  /** Screen content */
  children: ReactNode;
  /** Whether the content should scroll */
  scrollable?: boolean;
  /** Enable pull-to-refresh */
  refreshing?: boolean;
  /** Pull-to-refresh callback */
  onRefresh?: () => void;
  /** Add horizontal padding (spacing.lg) */
  padded?: boolean;
  /** Custom content container style */
  contentStyle?: StyleProp<ViewStyle>;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Override safe area insets behavior */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * Standard screen container with consistent safe area handling,
 * optional scrolling, and pull-to-refresh support.
 */
export function ScreenContainer({
  children,
  scrollable = false,
  refreshing,
  onRefresh,
  padded = false,
  contentStyle,
  style,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  const horizontalPadding = padded ? spacing.lg : 0;

  if (scrollable) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            {
              paddingTop: paddingTop + spacing.lg,
              paddingBottom: paddingBottom + spacing.lg,
              paddingLeft: paddingLeft + horizontalPadding,
              paddingRight: paddingRight + horizontalPadding,
            },
            contentStyle,
          ]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={colors.text.secondary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop,
          paddingBottom,
          paddingLeft: paddingLeft + horizontalPadding,
          paddingRight: paddingRight + horizontalPadding,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
