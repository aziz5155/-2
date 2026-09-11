import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { shadowElevation } from '../tokens';

interface CardProps extends ViewProps {
  elevation?: 0 | 1 | 2 | 3;
  padding?: number;
  radius?: number;
  backgroundColor?: string;
  bordered?: boolean;
}

export function Card({
  elevation = 1,
  padding,
  radius: radiusProp,
  backgroundColor,
  bordered = false,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();

  const shadow: ViewStyle = elevation > 0 ? shadowElevation(elevation as 1 | 2 | 3, theme.colors.shadow) : {};

  return (
    <View
      style={[
        {
          backgroundColor: backgroundColor ?? theme.colors.surface,
          borderRadius: radiusProp ?? theme.radius.lg,
          padding: padding ?? theme.spacing.md,
          borderWidth: bordered ? 1 : 0,
          borderColor: theme.colors.border,
        },
        shadow,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
