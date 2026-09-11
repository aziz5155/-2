import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';

export function LoadingState({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      {label ? (
        <AppText color="secondary" variant="caption">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg }}>
      <AppText style={{ fontSize: 32 }}>⚠️</AppText>
      <AppText color="secondary" align="center">
        {message}
      </AppText>
      {onRetry ? (
        <AppText color="brand" weight="semibold" onPress={onRetry}>
          {retryLabel ?? 'Retry'}
        </AppText>
      ) : null}
    </View>
  );
}
