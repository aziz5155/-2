import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { Avatar, AppText, Badge, Button, Card, ProgressBar, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { getChild, removeChild } from '@/services/children.service';
import { listGoals } from '@/services/goals.service';
import { listChildTransactions } from '@/services/points.service';
import { getStreak } from '@/services/streaks.service';
import { parentQuickComplete, listChildTasksForDate } from '@/services/tasks.service';
import { resetChildPin } from '@/services/auth.service';
import { todayDateOnly } from '@/utils/recurrence';

export default function ChildDetailScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = todayDateOnly();

  const childQuery = useQuery({ queryKey: ['child', childId], queryFn: () => getChild(childId!) });
  const tasksQuery = useQuery({
    queryKey: ['child-tasks', childId, today],
    queryFn: () => listChildTasksForDate(childId!, today),
  });
  const goalsQuery = useQuery({ queryKey: ['goals', childId], queryFn: () => listGoals(childId!) });
  const streakQuery = useQuery({ queryKey: ['streak', childId], queryFn: () => getStreak(childId!) });
  const txQuery = useQuery({ queryKey: ['transactions', childId], queryFn: () => listChildTransactions(childId!, 15) });

  const [completingId, setCompletingId] = useState<string | null>(null);

  if (childQuery.isLoading || !childQuery.data) return <LoadingState />;

  const child = childQuery.data;
  const level = getLevelInfo(child.lifetime_points);

  const handleQuickComplete = async (assignmentId: string) => {
    try {
      setCompletingId(assignmentId);
      await parentQuickComplete(assignmentId, today);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['child-tasks', childId] }),
        queryClient.invalidateQueries({ queryKey: ['child', childId] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', childId] }),
        queryClient.invalidateQueries({ queryKey: ['streak', childId] }),
      ]);
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setCompletingId(null);
    }
  };

  const handleRemove = () => {
    Alert.alert(t('children.removeChild'), t('children.removeChildConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeChild(child.id);
          queryClient.invalidateQueries({ queryKey: ['children'] });
          router.back();
        },
      },
    ]);
  };

  const handleResetPin = () => {
    Alert.prompt?.(t('children.setPin'), t('auth.pinHint'), async (pin) => {
      if (pin && /^\d{4}$/.test(pin)) {
        await resetChildPin(child.id, pin);
        Alert.alert(t('common.done'));
      }
    });
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={84} />
          <AppText variant="title">{child.name}</AppText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Badge label={`⭐ ${child.points_balance} ${t('common.pointsShort')}`} tone="points" />
            <Badge label={`${t('children.level')} ${level.level}`} tone="primary" />
            {streakQuery.data && streakQuery.data.current_streak > 0 && (
              <Badge label={`🔥 ${streakQuery.data.current_streak}`} tone="streak" />
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label={t('quickPoints.title')}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => router.push(`/(parent)/quick-points?childId=${child.id}&mode=grant`)}
          />
          <Button
            label={t('quickPoints.deductTitle')}
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => router.push(`/(parent)/quick-points?childId=${child.id}&mode=deduct`)}
          />
        </View>

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('childHome.todayTasks')}
          </AppText>
          <View style={{ gap: theme.spacing.xs }}>
            {tasksQuery.data?.length === 0 && (
              <AppText color="secondary">{t('childHome.noTasksToday')}</AppText>
            )}
            {tasksQuery.data?.map((task) => {
              const isDone = task.completion?.status === 'approved' || task.completion?.status === 'auto_approved';
              const isPending = task.completion?.status === 'pending_approval';
              return (
                <Card key={task.assignment_id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <AppIcon name={task.icon} size={22} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold">{task.title}</AppText>
                    <AppText variant="caption" color="secondary">
                      {task.points} {t('common.pointsShort')}
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
                      variant="secondary"
                      loading={completingId === task.assignment_id}
                      onPress={() => handleQuickComplete(task.assignment_id)}
                    />
                  )}
                </Card>
              );
            })}
          </View>
        </View>

        {goalsQuery.data && goalsQuery.data.length > 0 && (
          <View>
            <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
              {t('goals.title')}
            </AppText>
            <View style={{ gap: theme.spacing.xs }}>
              {goalsQuery.data.map((goal) => (
                <Card key={goal.id} style={{ gap: 6 }}>
                  <AppText variant="bodyBold">{goal.name}</AppText>
                  <ProgressBar progress={child.points_balance / goal.target_points} />
                  <AppText variant="caption" color="secondary">
                    {t('goals.progress', { current: child.points_balance, target: goal.target_points })}
                  </AppText>
                </Card>
              ))}
            </View>
          </View>
        )}

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('activity.title')}
          </AppText>
          <View style={{ gap: 4 }}>
            {txQuery.data?.map((tx) => (
              <View key={tx.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <AppText variant="caption" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                  {tx.reason}
                </AppText>
                <AppText variant="caption" weight="semibold" color={tx.amount >= 0 ? 'success' : 'danger'}>
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Button label={t('children.setPin')} variant="outline" onPress={handleResetPin} />
          <Button label={t('children.removeChild')} variant="ghost" onPress={handleRemove} />
        </View>
      </View>
    </Screen>
  );
}
