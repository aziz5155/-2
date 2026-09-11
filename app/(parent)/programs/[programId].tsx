import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Avatar, Button, Card, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import {
  enrollChildInProgram,
  getProgramEnrolledChildIds,
  getProgramWithTasks,
  updateProgramBonus,
} from '@/services/programs.service';

export default function ProgramDetailScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const programQuery = useQuery({ queryKey: ['program', programId], queryFn: () => getProgramWithTasks(programId!) });
  const enrolledQuery = useQuery({
    queryKey: ['program-enrolled', programId],
    queryFn: () => getProgramEnrolledChildIds(programId!),
  });
  const childrenQuery = useQuery({
    queryKey: ['children', familyQuery.data?.id],
    queryFn: () => listChildren(familyQuery.data!.id),
    enabled: !!familyQuery.data,
  });

  const [bonus, setBonus] = useState<string | null>(null);

  const handleToggleEnroll = async (childId: string) => {
    await enrollChildInProgram(programId!, childId);
    queryClient.invalidateQueries({ queryKey: ['program-enrolled', programId] });
  };

  const handleSaveBonus = async () => {
    if (bonus === null) return;
    await updateProgramBonus(programId!, Number(bonus) || 0);
    queryClient.invalidateQueries({ queryKey: ['program', programId] });
    setBonus(null);
  };

  if (programQuery.isLoading || !programQuery.data) return <LoadingState />;
  const program = programQuery.data;
  const totalPoints = program.tasks.reduce((sum, pt) => sum + pt.task.points, 0);

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <AppIcon name={program.icon} size={32} color={theme.colors.primary} />
          <AppText variant="display">{program.name}</AppText>
        </View>

        <Card>
          <AppText variant="caption" color="secondary">
            {t('programs.totalPoints')}
          </AppText>
          <AppText variant="title">{totalPoints}</AppText>
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <AppText variant="bodyBold">{t('programs.completionBonus')}</AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
            <Input
              style={{ flex: 1 }}
              keyboardType="number-pad"
              defaultValue={String(program.completion_bonus_points)}
              onChangeText={setBonus}
            />
            <Button label={t('common.save')} onPress={handleSaveBonus} disabled={bonus === null} />
          </View>
        </Card>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <AppText variant="subtitle">{t('programs.programTasks')}</AppText>
            <Button
              label={t('programs.addTaskToProgram')}
              size="sm"
              variant="secondary"
              onPress={() => router.push(`/(parent)/tasks/new?programId=${programId}`)}
            />
          </View>
          <View style={{ gap: theme.spacing.xs }}>
            {program.tasks.map((pt) => (
              <Card key={pt.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <AppIcon name={pt.task.icon} size={20} color={theme.colors.primary} />
                <AppText style={{ flex: 1 }}>{pt.task.title}</AppText>
                <AppText color="secondary" variant="caption">
                  {pt.task.points} {t('common.pointsShort')}
                </AppText>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('programs.assignedChildren')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {childrenQuery.data?.map((child) => {
              const enrolled = enrolledQuery.data?.includes(child.id);
              return (
                <Pressable key={child.id} onPress={() => handleToggleEnroll(child.id)} style={{ alignItems: 'center', gap: 4, opacity: enrolled ? 1 : 0.4 }}>
                  <View style={{ borderWidth: enrolled ? 2 : 0, borderColor: theme.colors.success, borderRadius: 30 }}>
                    <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={52} />
                  </View>
                  <AppText variant="caption">{child.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
