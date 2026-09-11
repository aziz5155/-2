import React from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '../ThemeProvider';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '✨', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.xs }}>
      <AppText style={{ fontSize: 44 }}>{emoji}</AppText>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color="secondary" align="center">
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
