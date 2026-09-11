import React from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'points' | 'streak';

interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
}

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const theme = useTheme();

  const tones: Record<Tone, { bg: string; text: string }> = {
    neutral: { bg: theme.colors.surfaceMuted, text: theme.colors.textSecondary },
    success: { bg: theme.colors.successMuted, text: theme.colors.success },
    warning: { bg: theme.colors.warningMuted, text: theme.colors.warning },
    danger: { bg: theme.colors.dangerMuted, text: theme.colors.danger },
    info: { bg: theme.colors.infoMuted, text: theme.colors.info },
    primary: { bg: theme.colors.primaryMuted, text: theme.colors.primaryText },
    points: { bg: theme.colors.pointsMuted, text: theme.colors.points },
    streak: { bg: theme.colors.streakMuted, text: theme.colors.streak },
  };

  const t = tones[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: t.bg,
        borderRadius: theme.radius.pill,
        paddingVertical: 5,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      <AppText variant="label" style={{ color: t.text }} weight="semibold">
        {label}
      </AppText>
    </View>
  );
}
