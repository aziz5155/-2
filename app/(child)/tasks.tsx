import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyChildProfile } from '@/services/children.service';
import { completeTask, listChildWeekSchedule } from '@/services/tasks.service';
import { todayDateOnly } from '@/utils/recurrence';

export default function ChildTasksScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const childQuery = useQuery({ queryKey: ['my-child-profile'], queryFn: getMyChildProfile });
  const childId = childQuery.data?.id;

  const scheduleQuery = useQuery({
    queryKey: ['child-week-schedule', childId],
    queryFn: () => listChildWeekSchedule(childId!),
    enabled: !!childId,
  });

  const [completingId, setCompletingId] = useState<string | null>(null);
  const today = todayDateOnly();

  const handleComplete = async (assignmentId: string, dateISO: string) => {
    try {
      setCompletingId(assignmentId);
      await completeTask(assignmentId, dateISO);
      await queryClient.invalidateQueries({ queryKey: ['child-week-schedule', childId] });
      await queryClient.invalidateQueries({ queryKey: ['my-child-profile'] });
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setCompletingId(null);
    }
  };

  if (scheduleQuery.isLoading) return <LoadingState />;

  const hasAny = scheduleQuery.data?.some((day) => day.tasks.length > 0);

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">{t('tasks.title')}</AppText>

        {!hasAny && <EmptyState emoji="🎉" title={t('childHome.noTasksToday')} />}

        {scheduleQuery.data?.map((day) => {
          if (day.tasks.length === 0) return null;
          const isToday = day.dateISO === today;
          const label = isToday
            ? t('common.today')
            : new Date(day.dateISO).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

          return (
            <View key={day.dateISO} style={{ gap: theme.spacing.sm }}>
              <AppText variant="subtitle">{label}</AppText>
              {day.tasks.map((task) => {
                const isDone = task.completion?.status === 'approved' || task.completion?.status === 'auto_approved';
                const isPending = task.completion?.status === 'pending_approval';
                return (
                  <Card key={task.assignment_id + day.dateISO} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                    <AppIcon name={task.icon} size={22} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold">{task.title}</AppText>
                      <AppText variant="caption" color="secondary">
                        ⭐ {task.points}
                      </AppText>
                    </View>
                    {isDone ? (
                      <Badge label={t('tasks.completed')} tone="success" />
                    ) : isPending ? (
                      <Badge label={t('tasks.waitingApproval')} tone="warning" />
                    ) : isToday ? (
                      <Button
                        label={t('tasks.markComplete')}
                        size="sm"
                        loading={completingId === task.assignment_id}
                        onPress={() => handleComplete(task.assignment_id, day.dateISO)}
                      />
                    ) : (
                      <Badge label="—" tone="neutral" />
                    )}
                  </Card>
                );
              })}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
