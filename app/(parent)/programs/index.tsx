import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Button, Card, EmptyState, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyFamily } from '@/services/family.service';
import { createProgram, listPrograms } from '@/services/programs.service';

export default function ProgramsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const programsQuery = useQuery({
    queryKey: ['programs', familyId],
    queryFn: () => listPrograms(familyId!),
    enabled: !!familyId,
  });

  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateCustom = async () => {
    if (!customName.trim() || !familyId) return;
    setCreating(true);
    const program = await createProgram(familyId, customName.trim(), 'sparkles', 0);
    setCustomName('');
    setCreating(false);
    await queryClient.invalidateQueries({ queryKey: ['programs'] });
    router.push(`/(parent)/programs/${program.id}`);
  };

  if (programsQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">{t('programs.title')}</AppText>
          <Button label={t('programs.templates')} size="sm" onPress={() => router.push('/(parent)/programs/templates')} />
        </View>

        {programsQuery.data?.length === 0 && (
          <EmptyState
            emoji="🌅"
            title={t('programs.noPrograms')}
            subtitle={t('programs.templates')}
            actionLabel={t('programs.useTemplate')}
            onAction={() => router.push('/(parent)/programs/templates')}
          />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {programsQuery.data?.map((program) => (
            <Pressable key={program.id} onPress={() => router.push(`/(parent)/programs/${program.id}`)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <AppIcon name={program.icon} size={26} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{program.name}</AppText>
                  {program.completion_bonus_points > 0 && (
                    <AppText variant="caption" color="secondary">
                      + {program.completion_bonus_points} {t('programs.completionBonus')}
                    </AppText>
                  )}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <Card style={{ gap: theme.spacing.sm }}>
          <AppText variant="bodyBold">{t('programs.newProgram')}</AppText>
          <Input placeholder={t('programs.programName')} value={customName} onChangeText={setCustomName} />
          <Button label={t('common.add')} onPress={handleCreateCustom} loading={creating} disabled={!customName.trim()} />
        </Card>
      </View>
    </Screen>
  );
}
