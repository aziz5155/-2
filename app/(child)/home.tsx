import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, EmptyState, ProgressBar, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { getMyChildProfile } from '@/services/children.service';
import { getStreak } from '@/services/streaks.service';
import { completeTask, listChildTasksForDate } from '@/services/tasks.service';
import { todayDateOnly } from '@/utils/recurrence';

export default function ChildHomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const today = todayDateOnly();

  const childQuery = useQuery({ queryKey: ['my-child-profile'], queryFn: getMyChildProfile });
  const childId = childQuery.data?.id;

  const tasksQuery = useQuery({
    queryKey: ['child-tasks', childId, today],
    queryFn: () => listChildTasksForDate(childId!, today),
    enabled: !!childId,
  });

  const streakQuery = useQuery({ queryKey: ['streak', childId], queryFn: () => getStreak(childId!), enabled: !!childId });

  const [completingId, setCompletingId] = useState<string | null>(null);

  if (childQuery.isLoading || !childQuery.data) return <LoadingState />;
  const child = childQuery.data;
  const level = getLevelInfo(child.lifetime_points);

  const handleComplete = async (assignmentId: string) => {
    try {
      setCompletingId(assignmentId);
      await completeTask(assignmentId, today);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['child-tasks', childId] }),
        queryClient.invalidateQueries({ queryKey: ['my-child-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['streak', childId] }),
      ]);
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setCompletingId(null);
    }
  };

  const streak = streakQuery.data?.current_streak ?? 0;
  const wasStreakBroken =
    streakQuery.data?.last_completed_date &&
    new Date(streakQuery.data.last_completed_date).toISOString().slice(0, 10) !== today &&
    streak === 0;

  return (
    <Screen scroll onRefresh={() => tasksQuery.refetch()} refreshing={tasksQuery.isFetching}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">{t('childHome.greeting', { name: child.name.split(' ')[0] })}</AppText>

        <Card backgroundColor={theme.colors.primary} style={{ gap: theme.spacing.sm }}>
          <AppText style={{ color: theme.colors.onPrimary }} variant="caption">
            {t('childHome.yourBalance')}
          </AppText>
          <AppText style={{ color: theme.colors.onPrimary }} variant="hero">
            ⭐ {child.points_balance}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge label={t('childHome.level', { level: level.level })} tone="neutral" />
            {streak > 0 && <Badge label={t('childHome.streakDays', { count: streak })} tone="neutral" />}
          </View>
          <ProgressBar progress={level.progress} color={theme.colors.onPrimary} trackColor="rgba(255,255,255,0.25)" />
        </Card>

        {wasStreakBroken && (
          <Card backgroundColor={theme.colors.infoMuted} elevation={0}>
            <AppText align="center">{t('childHome.streakReset')}</AppText>
          </Card>
        )}

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('childHome.todayTasks')}
          </AppText>

          {tasksQuery.data?.length === 0 && <EmptyState emoji="🎉" title={t('childHome.noTasksToday')} />}

          <View style={{ gap: theme.spacing.sm }}>
            {tasksQuery.data?.map((task) => {
              const isDone = task.completion?.status === 'approved' || task.completion?.status === 'auto_approved';
              const isPending = task.completion?.status === 'pending_approval';
              return (
                <Card key={task.assignment_id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name={task.icon} size={22} color={theme.colors.primary} />
                  </View>
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
                  ) : (
                    <Button
                      label={t('tasks.markComplete')}
                      size="sm"
                      loading={completingId === task.assignment_id}
                      onPress={() => handleComplete(task.assignment_id)}
                    />
                  )}
                </Card>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
