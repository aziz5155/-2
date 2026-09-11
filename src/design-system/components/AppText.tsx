import React from 'react';
import { I18nManager, Text, TextProps, TextStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';

type Variant =
  | 'hero'
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label';

type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand' | 'danger' | 'success';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
  align?: TextStyle['textAlign'];
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
}

export function AppText({
  variant = 'body',
  color = 'primary',
  align,
  weight,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  const variantStyle: TextStyle = {
    hero: { fontSize: theme.fontSize.hero, lineHeight: theme.lineHeight.hero, fontWeight: theme.fontWeight.extrabold as TextStyle['fontWeight'] },
    display: { fontSize: theme.fontSize.display, lineHeight: theme.lineHeight.display, fontWeight: theme.fontWeight.bold as TextStyle['fontWeight'] },
    title: { fontSize: theme.fontSize.xl, lineHeight: theme.lineHeight.xl, fontWeight: theme.fontWeight.bold as TextStyle['fontWeight'] },
    subtitle: { fontSize: theme.fontSize.lg, lineHeight: theme.lineHeight.lg, fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'] },
    body: { fontSize: theme.fontSize.md, lineHeight: theme.lineHeight.md, fontWeight: theme.fontWeight.regular as TextStyle['fontWeight'] },
    bodyBold: { fontSize: theme.fontSize.md, lineHeight: theme.lineHeight.md, fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'] },
    caption: { fontSize: theme.fontSize.sm, lineHeight: theme.lineHeight.sm, fontWeight: theme.fontWeight.regular as TextStyle['fontWeight'] },
    label: { fontSize: theme.fontSize.xs, lineHeight: theme.lineHeight.xs, fontWeight: theme.fontWeight.medium as TextStyle['fontWeight'] },
  }[variant];

  const colorValue = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    inverse: theme.colors.textInverse,
    brand: theme.colors.primary,
    danger: theme.colors.danger,
    success: theme.colors.success,
  }[color];

  const weightOverride = weight ? { fontWeight: theme.fontWeight[weight] as TextStyle['fontWeight'] } : null;

  return (
    <Text
      style={[
        variantStyle,
        { color: colorValue, textAlign: align, writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
        weightOverride,
        style,
      ]}
      {...rest}
    />
  );
}
