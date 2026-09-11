import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppText, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listActivity } from '@/services/activity.service';
import { getMyFamily } from '@/services/family.service';

const EVENT_EMOJI: Record<string, string> = {
  task_completed: '✅',
  task_pending_approval: '⏳',
  task_approved: '⭐',
  task_rejected: '↩️',
  manual_bonus: '🎁',
  manual_deduction: '⚠️',
  redemption_requested: '🛒',
  redemption_approved: '🎉',
  redemption_rejected: '❌',
  achievement_unlocked: '🏆',
  goal_reached: '🎯',
  program_bonus: '✨',
  challenge_completed: '🏁',
};

export default function ActivityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const activityQuery = useQuery({
    queryKey: ['activity', familyId],
    queryFn: () => listActivity(familyId!),
    enabled: !!familyId,
  });

  if (activityQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll onRefresh={() => activityQuery.refetch()} refreshing={activityQuery.isFetching}>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('activity.title')}</AppText>

        {activityQuery.data?.length === 0 && <EmptyState emoji="📭" title={t('activity.empty')} />}

        <View style={{ gap: theme.spacing.xs }}>
          {activityQuery.data?.map((event) => (
            <Card key={event.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }} elevation={0}>
              <AppText style={{ fontSize: 20 }}>{EVENT_EMOJI[event.event_type] ?? '•'}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="body">
                  {event.actor_name ? `${event.actor_name} · ` : ''}
                  {String(event.message_params?.taskName ?? event.message_params?.rewardName ?? event.message_params?.programName ?? event.message_params?.goalName ?? event.message_params?.achievementName ?? event.message_params?.challengeName ?? event.message_key)}
                </AppText>
                <AppText variant="caption" color="tertiary">
                  {new Date(event.created_at).toLocaleString()}
                </AppText>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
