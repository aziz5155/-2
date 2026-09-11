import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppText, Avatar, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import { getWeeklyPointsComparison } from '@/services/points.service';
import { getStreak } from '@/services/streaks.service';
import { Child } from '@/types/models';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const theme = useTheme();
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="caption" weight="semibold">
          {value}
        </AppText>
      </View>
      <View style={{ height: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceMuted }}>
        <View style={{ height: 10, width: `${width}%`, borderRadius: theme.radius.pill, backgroundColor: color }} />
      </View>
    </View>
  );
}

function ChildAnalyticsCard({ child }: { child: Child }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const weeklyQuery = useQuery({ queryKey: ['weekly-points', child.id], queryFn: () => getWeeklyPointsComparison(child.id) });
  const streakQuery = useQuery({ queryKey: ['streak', child.id], queryFn: () => getStreak(child.id) });

  const thisWeek = weeklyQuery.data?.thisWeek ?? 0;
  const lastWeek = weeklyQuery.data?.lastWeek ?? 0;
  const max = Math.max(thisWeek, lastWeek, 10);

  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={40} />
        <AppText variant="bodyBold">{child.name}</AppText>
      </View>
      <Bar label={t('analytics.thisWeek')} value={thisWeek} max={max} color={theme.colors.primary} />
      <Bar label={t('analytics.lastWeek')} value={lastWeek} max={max} color={theme.colors.textTertiary} />
      <AppText variant="caption" color="secondary">
        🔥 {streakQuery.data?.current_streak ?? 0} · {t('dashboard.bestStreak')}: {streakQuery.data?.longest_streak ?? 0}
      </AppText>
    </Card>
  );
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const childrenQuery = useQuery({
    queryKey: ['children', familyQuery.data?.id],
    queryFn: () => listChildren(familyQuery.data!.id),
    enabled: !!familyQuery.data,
  });

  if (childrenQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('analytics.title')}</AppText>
        <View style={{ gap: theme.spacing.sm }}>
          {childrenQuery.data?.map((child) => (
            <ChildAnalyticsCard key={child.id} child={child} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
