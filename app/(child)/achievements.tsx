import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, Input, ProgressBar, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listAchievementCatalog, listChildAchievements } from '@/services/achievements.service';
import { getMyChildProfile } from '@/services/children.service';
import { createGoal, listGoals } from '@/services/goals.service';

export default function ChildAchievementsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const childQuery = useQuery({ queryKey: ['my-child-profile'], queryFn: getMyChildProfile });
  const child = childQuery.data;

  const catalogQuery = useQuery({ queryKey: ['achievement-catalog'], queryFn: listAchievementCatalog });
  const unlockedQuery = useQuery({
    queryKey: ['child-achievements', child?.id],
    queryFn: () => listChildAchievements(child!.id),
    enabled: !!child,
  });
  const goalsQuery = useQuery({ queryKey: ['goals', child?.id], queryFn: () => listGoals(child!.id), enabled: !!child });

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  const handleAddGoal = async () => {
    if (!goalName.trim() || !goalTarget || !child) return;
    setAddingGoal(true);
    try {
      await createGoal(child.id, child.family_id, goalName.trim(), 'target', Number(goalTarget));
      setGoalName('');
      setGoalTarget('');
      queryClient.invalidateQueries({ queryKey: ['goals', child.id] });
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setAddingGoal(false);
    }
  };

  if (catalogQuery.isLoading || !child) return <LoadingState />;

  const unlockedIds = new Set(unlockedQuery.data?.map((a) => a.achievement_id));

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">{t('achievements.title')}</AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {catalogQuery.data?.map((ach) => {
            const unlocked = unlockedIds.has(ach.id);
            return (
              <Card
                key={ach.id}
                style={{ width: '47%', alignItems: 'center', gap: 6, opacity: unlocked ? 1 : 0.4 }}
                backgroundColor={unlocked ? theme.colors.pointsMuted : theme.colors.surfaceMuted}
                elevation={0}
              >
                <AppIcon name={ach.icon} size={30} color={unlocked ? theme.colors.points : theme.colors.textTertiary} />
                <AppText variant="bodyBold" align="center">
                  {ach.name}
                </AppText>
                <Badge label={unlocked ? t('achievements.unlocked') : t('achievements.locked')} tone={unlocked ? 'success' : 'neutral'} />
              </Card>
            );
          })}
        </View>

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('goals.title')}
          </AppText>

          <View style={{ gap: theme.spacing.sm }}>
            {goalsQuery.data?.map((goal) => (
              <Card key={goal.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodyBold">{goal.name}</AppText>
                  {goal.is_achieved && <Badge label="🎉" tone="success" />}
                </View>
                <ProgressBar progress={child.points_balance / goal.target_points} />
                <AppText variant="caption" color="secondary">
                  {t('goals.progress', { current: Math.min(child.points_balance, goal.target_points), target: goal.target_points })}
                </AppText>
              </Card>
            ))}
          </View>

          <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <AppText variant="bodyBold">{t('goals.newGoal')}</AppText>
            <Input placeholder={t('goals.goalName')} value={goalName} onChangeText={setGoalName} />
            <Input
              placeholder={t('goals.targetPoints')}
              value={goalTarget}
              onChangeText={setGoalTarget}
              keyboardType="number-pad"
            />
            <Button label={t('common.add')} onPress={handleAddGoal} loading={addingGoal} disabled={!goalName.trim() || !goalTarget} />
          </Card>
        </View>
      </View>
    </Screen>
  );
}
