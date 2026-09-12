import React, { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';
import { useIsRTL } from '@/stores/locale.store';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, rightElement, style, ...rest }: InputProps) {
  const theme = useTheme();
  const rtl = useIsRTL();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="label" color="secondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: error ? theme.colors.danger : focused ? theme.colors.primary : 'transparent',
          paddingHorizontal: theme.spacing.sm,
        }}
      >
        <TextInput
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: 13,
              fontSize: theme.fontSize.md,
              color: theme.colors.textPrimary,
              textAlign: rtl ? 'right' : 'left',
              writingDirection: rtl ? 'rtl' : 'ltr',
            },
            style,
          ]}
          {...rest}
        />
        {rightElement}
      </View>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
