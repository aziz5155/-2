import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { awardPoints, deductPoints, QUICK_POINT_AMOUNTS } from '@/services/points.service';

export default function QuickPointsScreen() {
  const { childId, mode } = useLocalSearchParams<{ childId: string; mode: 'grant' | 'deduct' }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isDeduct = mode === 'deduct';
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const finalAmount = amount ?? (Number(customAmount) || 0);

  const handleSubmit = async () => {
    if (finalAmount <= 0) return;
    if (!reason.trim()) {
      Alert.alert(t('quickPoints.reasonRequired'));
      return;
    }
    try {
      setLoading(true);
      if (isDeduct) {
        await deductPoints(childId!, finalAmount, reason.trim());
      } else {
        await awardPoints(childId!, finalAmount, reason.trim());
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['child', childId] }),
        queryClient.invalidateQueries({ queryKey: ['children'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', childId] }),
      ]);
      router.back();
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
        <AppText variant="display">{isDeduct ? t('quickPoints.deductTitle') : t('quickPoints.title')}</AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {QUICK_POINT_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                setAmount(value);
                setCustomAmount('');
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: theme.radius.md,
                backgroundColor: amount === value ? theme.colors.primary : theme.colors.surfaceMuted,
              }}
            >
              <AppText weight="bold" style={{ color: amount === value ? theme.colors.onPrimary : theme.colors.textPrimary }}>
                {isDeduct ? '-' : '+'}
                {value}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Input
          label={t('quickPoints.customAmount')}
          keyboardType="number-pad"
          value={customAmount}
          onChangeText={(v) => {
            setCustomAmount(v);
            setAmount(null);
          }}
          placeholder="0"
        />

        <Input
          label={t('quickPoints.reasonLabel')}
          value={reason}
          onChangeText={setReason}
          placeholder={isDeduct ? t('quickPoints.deductTitle') : t('quickPoints.title')}
        />

        <Button
          label={isDeduct ? t('quickPoints.deduct') : t('quickPoints.grant')}
          onPress={handleSubmit}
          loading={loading}
          disabled={finalAmount <= 0}
          variant={isDeduct ? 'danger' : 'primary'}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
