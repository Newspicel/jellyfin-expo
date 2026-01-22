import { ComponentProps, forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors, spacing, radii, fontSizes } from '@/theme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export type InputSize = 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label displayed above the input */
  label?: string;
  /** Error message (also changes border color to error) */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** SF Symbol icon to display on the left */
  leftIcon?: IconName;
  /** Input size */
  size?: InputSize;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input field style */
  inputStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG = {
  md: { height: 44, fontSize: fontSizes.md, iconSize: 18, iconPadding: 40 },
  lg: { height: 48, fontSize: fontSizes.base, iconSize: 20, iconPadding: 44 },
} as const;

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    size = 'lg',
    containerStyle,
    inputStyle,
    ...textInputProps
  },
  ref
) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];

  const getBorderColor = () => {
    if (error) return colors.status.error;
    if (isFocused) return colors.border.focus;
    return colors.border.default;
  };

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={[styles.label, { color: colors.text.secondary }]}>
          {label}
        </ThemedText>
      )}
      <View style={styles.inputWrapper}>
        {leftIcon && (
          <View style={[styles.iconContainer, { left: spacing.md }]}>
            <IconSymbol
              name={leftIcon}
              size={sizeConfig.iconSize}
              color={isFocused ? colors.interactive.primary : colors.text.tertiary}
            />
          </View>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              height: sizeConfig.height,
              fontSize: sizeConfig.fontSize,
              color: colors.text.primary,
              borderColor: getBorderColor(),
              backgroundColor: colors.background.secondary,
              paddingLeft: leftIcon ? sizeConfig.iconPadding : spacing.lg,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />
      </View>
      {(error || helperText) && (
        <ThemedText
          style={[
            styles.helperText,
            { color: error ? colors.status.error : colors.text.tertiary },
          ]}
        >
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingRight: spacing.lg,
  },
  helperText: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
