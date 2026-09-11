import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { deletePromoCode, listPromoCodes, updatePromoCodeStatus } from '@/services/admin.service';
import { PromoCode } from '@/types/admin';

const STATUS_LABEL: Record<PromoCode['status'], string> = {
  active: 'مفعّل',
  paused: 'متوقف',
  archived: 'مؤرشف',
};

export default function PromoCodesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const codesQuery = useQuery({ queryKey: ['promo-codes'], queryFn: listPromoCodes });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] });

  const handlePauseToggle = async (code: PromoCode) => {
    try {
      await updatePromoCodeStatus(code.id, code.status === 'active' ? 'paused' : 'active');
      invalidate();
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : undefined);
    }
  };

  const handleArchive = async (code: PromoCode) => {
    try {
      await updatePromoCodeStatus(code.id, 'archived');
      invalidate();
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : undefined);
    }
  };

  const handleDelete = (code: PromoCode) => {
    Alert.alert('حذف الكود', `هل تريد حذف الكود ${code.code}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePromoCode(code.id);
            invalidate();
          } catch (e) {
            Alert.alert('لا يمكن الحذف', e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  };

  if (codesQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">أكواد الخصم</AppText>
          <Button label="+ كود جديد" size="sm" onPress={() => router.push('/(owner)/promo-codes/new')} />
        </View>

        {codesQuery.data?.length === 0 && <EmptyState emoji="🎟️" title="لا توجد أكواد بعد" />}

        <View style={{ gap: theme.spacing.sm }}>
          {codesQuery.data?.map((code) => (
            <Card key={code.id} style={{ gap: theme.spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="bodyBold">{code.code}</AppText>
                <Badge
                  label={STATUS_LABEL[code.status]}
                  tone={code.status === 'active' ? 'success' : code.status === 'paused' ? 'warning' : 'neutral'}
                />
              </View>
              <AppText variant="caption" color="secondary">
                خصم {code.discount_percent}% · استُخدم {code.times_redeemed}
                {code.max_redemptions ? ` من ${code.max_redemptions}` : ' مرة (بلا حد)'}
              </AppText>
              <AppText variant="caption" color="tertiary">
                {code.ends_at ? `ينتهي: ${new Date(code.ends_at).toLocaleString('ar-SA')}` : 'بلا تاريخ انتهاء'}
                {code.applies_to_first_n_payments ? ` · لأول ${code.applies_to_first_n_payments} دفعات فقط` : ''}
              </AppText>

              {code.status !== 'archived' && (
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                  <Button
                    label={code.status === 'active' ? 'إيقاف' : 'تفعيل'}
                    size="sm"
                    variant="secondary"
                    style={{ flex: 1 }}
                    onPress={() => handlePauseToggle(code)}
                  />
                  {code.times_redeemed > 0 ? (
                    <Button label="أرشفة" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => handleArchive(code)} />
                  ) : (
                    <Button label="حذف" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => handleDelete(code)} />
                  )}
                </View>
              )}
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
