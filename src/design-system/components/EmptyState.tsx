import { View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { AppIcon } from '../icons';
import { useTheme } from '../ThemeProvider';

interface EmptyStateProps {
  /** Icon key resolved via resolveIcon (see design-system/icons.tsx). Preferred over emoji. */
  icon?: string;
  /** @deprecated pass `icon` instead — kept only so unmigrated call sites still render something. */
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, gap: theme.spacing.xs }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.xs,
        }}
      >
        <AppIcon name={icon ?? 'sparkles'} size={26} color={theme.colors.primary} />
      </View>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color="secondary" align="center" style={{ maxWidth: 280 }}>
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
