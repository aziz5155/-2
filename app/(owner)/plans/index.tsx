import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText, Badge, Button, Card, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listAllPlans, updatePlan } from '@/services/admin.service';
import { BillingPeriod, Plan } from '@/types/admin';

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
};

function PlanCard({ plan }: { plan: Plan }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(plan.price_amount));
  const [saving, setSaving] = useState(false);

  const handleSavePrice = async () => {
    const numeric = Number(price);
    if (Number.isNaN(numeric) || numeric < 0) return;
    try {
      setSaving(true);
      await updatePlan(plan.id, { price_amount: numeric });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await updatePlan(plan.id, { is_active: !plan.is_active });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <Card style={{ gap: theme.spacing.sm, opacity: plan.is_active ? 1 : 0.5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="bodyBold">{plan.name}</AppText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {plan.billing_period && <Badge label={PERIOD_LABELS[plan.billing_period]} tone="info" />}
          <Badge label={plan.tier === 'free' ? 'مجانية' : 'مدفوعة'} tone={plan.tier === 'free' ? 'neutral' : 'primary'} />
        </View>
      </View>

      {plan.tier === 'premium' && (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
          <Input style={{ flex: 1 }} label="السعر (ر.س)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
          <Button label="حفظ" size="sm" onPress={handleSavePrice} loading={saving} />
        </View>
      )}

      {plan.trial_days > 0 && (
        <AppText variant="caption" color="secondary">
          فترة تجريبية: {plan.trial_days} أيام
        </AppText>
      )}

      <Pressable onPress={handleToggleActive}>
        <AppText color={plan.is_active ? 'danger' : 'success'} weight="semibold" variant="caption">
          {plan.is_active ? 'إيقاف الباقة' : 'تفعيل الباقة'}
        </AppText>
      </Pressable>
    </Card>
  );
}

export default function PlansScreen() {
  const theme = useTheme();
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listAllPlans });

  if (plansQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">الباقات والأسعار</AppText>
        <AppText color="secondary" variant="caption">
          يمكنك تعديل السعر وتفعيل/إيقاف أي باقة مباشرة. الاشتراكات الحالية لا تتأثر بتغيير
          السعر إلا عند تجديدها.
        </AppText>

        <View style={{ gap: theme.spacing.sm }}>
          {plansQuery.data?.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
