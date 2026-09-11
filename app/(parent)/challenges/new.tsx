import { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { createChallenge } from '@/services/challenges.service';
import { getMyFamily } from '@/services/family.service';
import { todayDateOnly } from '@/utils/recurrence';

export default function NewChallengeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState('7');
  const [rewardPoints, setRewardPoints] = useState('200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !familyQuery.data) return setError(t('common.requiredField'));
    try {
      setLoading(true);
      const end = new Date();
      end.setDate(end.getDate() + (Number(days) || 1) - 1);

      await createChallenge({
        family_id: familyQuery.data.id,
        name: name.trim(),
        description: description.trim() || null,
        icon: 'flag',
        linked_task_id: null,
        start_date: todayDateOnly(),
        end_date: end.toISOString().slice(0, 10),
        reward_points: Number(rewardPoints) || 0,
      });
      await queryClient.invalidateQueries({ queryKey: ['challenges'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
        <AppText variant="display">{t('challenges.newChallenge')}</AppText>
        <Input label={t('tasks.taskName')} value={name} onChangeText={setName} />
        <Input label={t('tasks.taskDescription')} value={description} onChangeText={setDescription} multiline />
        <Input label="Duration (days)" value={days} onChangeText={setDays} keyboardType="number-pad" />
        <Input label={t('challenges.reward')} value={rewardPoints} onChangeText={setRewardPoints} keyboardType="number-pad" />
        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}
        <Button label={t('common.save')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />
      </View>
    </Screen>
  );
}
