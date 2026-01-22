import { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors, spacing, radii } from '@/theme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button label text (not used for icon variant) */
  children?: string;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** SF Symbol icon to display before the label */
  leftIcon?: IconName;
  /** SF Symbol icon to display after the label */
  rightIcon?: IconName;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG = {
  sm: { height: 36, paddingHorizontal: spacing.md, fontSize: 14, iconSize: 18 },
  md: { height: 44, paddingHorizontal: spacing.lg, fontSize: 16, iconSize: 20 },
  lg: { height: 48, paddingHorizontal: spacing.xl, fontSize: 17, iconSize: 22 },
} as const;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
}: ButtonProps) {
  const colors = useColors();
  const sizeConfig = SIZE_CONFIG[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.interactive.disabled;

    switch (variant) {
      case 'primary':
        return pressed ? colors.interactive.primaryPressed : colors.interactive.primary;
      case 'secondary':
        return pressed ? colors.interactive.secondaryHover : colors.interactive.secondary;
      case 'destructive':
        return pressed ? colors.status.errorBackground : colors.status.error;
      case 'ghost':
        return pressed ? colors.interactive.secondary : 'transparent';
      case 'icon':
        return pressed ? colors.interactive.secondaryHover : colors.background.secondary;
      default:
        return colors.interactive.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.text.tertiary;

    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'destructive':
        return colors.text.inverse;
      case 'ghost':
        return colors.interactive.primary;
      case 'icon':
        return colors.text.secondary;
      default:
        return colors.text.inverse;
    }
  };

  const textColor = getTextColor();
  const isIconOnly = variant === 'icon';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeConfig.height,
          backgroundColor: getBackgroundColor(pressed),
          paddingHorizontal: isIconOnly ? 0 : sizeConfig.paddingHorizontal,
          borderRadius: isIconOnly ? radii.md : radii.md,
        },
        isIconOnly && {
          width: sizeConfig.height,
          paddingHorizontal: 0,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {leftIcon && (
              <IconSymbol
                name={leftIcon}
                size={sizeConfig.iconSize}
                color={textColor}
                style={children ? styles.leftIcon : undefined}
              />
            )}
            {children && !isIconOnly && (
              <ThemedText
                style={[
                  styles.text,
                  {
                    fontSize: sizeConfig.fontSize,
                    color: textColor,
                  },
                ]}
              >
                {children}
              </ThemedText>
            )}
            {/* For icon variant, render the leftIcon as the main icon */}
            {isIconOnly && leftIcon && !loading && (
              <IconSymbol
                name={leftIcon}
                size={sizeConfig.iconSize}
                color={textColor}
              />
            )}
            {rightIcon && !isIconOnly && (
              <IconSymbol
                name={rightIcon}
                size={sizeConfig.iconSize}
                color={textColor}
                style={styles.rightIcon}
              />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
});
