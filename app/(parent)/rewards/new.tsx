import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyFamily } from '@/services/family.service';
import { createReward } from '@/services/rewards.service';

export default function NewRewardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('gift');
  const [cost, setCost] = useState('100');
  const [usageLimit, setUsageLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError(t('common.requiredField'));
    if (!familyQuery.data) return;
    try {
      setLoading(true);
      await createReward({
        family_id: familyQuery.data.id,
        name: name.trim(),
        description: description.trim() || null,
        icon,
        cost_points: Number(cost) || 0,
        usage_limit: usageLimit ? Number(usageLimit) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ['rewards'] });
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
        <AppText variant="display">{t('rewards.newReward')}</AppText>

        <AppText variant="label" color="secondary">
          {t('tasks.taskIcon')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {['gift', 'star', 'trophy', 'heart', 'sparkles', 'screen', 'beach', 'dumbbell'].map((key) => (
            <Pressable
              key={key}
              onPress={() => setIcon(key)}
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: icon === key ? theme.colors.primaryMuted : theme.colors.surfaceMuted,
              }}
            >
              <AppIcon name={key} color={icon === key ? theme.colors.primary : theme.colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Input label={t('rewards.rewardName')} value={name} onChangeText={setName} />
        <Input label={t('rewards.rewardDescription')} value={description} onChangeText={setDescription} multiline />
        <Input label={t('rewards.rewardCost')} value={cost} onChangeText={setCost} keyboardType="number-pad" />
        <Input
          label={`${t('rewards.usageLimit')} (${t('common.optional')})`}
          value={usageLimit}
          onChangeText={setUsageLimit}
          keyboardType="number-pad"
          placeholder={t('rewards.unlimited')}
        />

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
