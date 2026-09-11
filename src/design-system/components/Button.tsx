import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyle = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: theme.fontSize.sm },
    md: { paddingVertical: 13, paddingHorizontal: 18, fontSize: theme.fontSize.md },
    lg: { paddingVertical: 17, paddingHorizontal: 22, fontSize: theme.fontSize.lg },
  }[size];

  const palette: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: theme.colors.primary, text: theme.colors.onPrimary },
    secondary: { bg: theme.colors.primaryMuted, text: theme.colors.primaryText },
    outline: { bg: 'transparent', text: theme.colors.textPrimary, border: theme.colors.border },
    ghost: { bg: 'transparent', text: theme.colors.primary },
    danger: { bg: theme.colors.danger, text: theme.colors.onPrimary },
  };

  const p = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: p.bg,
          borderRadius: theme.radius.md,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.text} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {leftIcon}
          <AppText style={{ color: p.text, fontSize: sizeStyle.fontSize }} weight="semibold">
            {label}
          </AppText>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
