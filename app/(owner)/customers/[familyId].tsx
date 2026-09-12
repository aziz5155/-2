import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { AppText, Badge, Button, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import {
  getCustomerDetail,
  grantSubscription,
  listAllPlans,
  listFamilyPayments,
  listFamilyRedemptions,
} from '@/services/admin.service';

const DURATIONS = [
  { key: 'permanent', label: 'دائم', days: null as number | null },
  { key: '7d', label: '7 أيام', days: 7 },
  { key: '30d', label: '30 يوم', days: 30 },
  { key: '90d', label: '90 يوم', days: 90 },
  { key: '1y', label: 'سنة', days: 365 },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
      }}
    >
      <AppText style={{ color: selected ? '#fff' : theme.colors.textPrimary }} weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

export default function CustomerDetailScreen() {
  const { familyId } = useLocalSearchParams<{ familyId: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({ queryKey: ['customer-detail', familyId], queryFn: () => getCustomerDetail(familyId!) });
  const paymentsQuery = useQuery({ queryKey: ['customer-payments', familyId], queryFn: () => listFamilyPayments(familyId!) });
  const redemptionsQuery = useQuery({ queryKey: ['customer-redemptions', familyId], queryFn: () => listFamilyRedemptions(familyId!) });
  const plansQuery = useQuery({ queryKey: ['all-plans'], queryFn: listAllPlans });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('permanent');
  const [granting, setGranting] = useState(false);

  const handleGrant = async () => {
    if (!selectedPlanId || !familyId) return;
    const duration = DURATIONS.find((d) => d.key === selectedDuration);
    const expiresAt = duration?.days ? new Date(Date.now() + duration.days * 86400000).toISOString() : null;
    try {
      setGranting(true);
      await grantSubscription(familyId, selectedPlanId, expiresAt);
      await queryClient.invalidateQueries({ queryKey: ['customer-detail', familyId] });
      Alert.alert('تم', 'تم تحديث باقة العميل بنجاح');
    } catch (e) {
      Alert.alert('حدث خطأ', e instanceof Error ? e.message : undefined);
    } finally {
      setGranting(false);
    }
  };

  if (detailQuery.isLoading || !detailQuery.data) return <LoadingState />;
  const family = detailQuery.data;
  const activePlans = plansQuery.data?.filter((p) => p.is_active) ?? [];

  const statusLabel: Record<string, string> = {
    pending_provider: 'بانتظار بوابة الدفع',
    succeeded: 'مكتمل',
    failed: 'فشل',
    refunded: 'مسترد',
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <View>
          <AppText variant="display">{family.name}</AppText>
          <AppText color="secondary">
            {family.owner_name} · {family.owner_email ?? 'بلا بريد'}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Badge label={family.plan_name ?? 'بلا باقة'} tone={family.plan_key === 'free' ? 'neutral' : 'primary'} />
          <Badge label={`${family.children_count} أبناء`} tone="info" />
          <Badge label={`كود: ${family.family_code}`} tone="neutral" />
        </View>

        {family.current_period_end && (
          <AppText variant="caption" color="secondary">
            تنتهي الفترة الحالية: {new Date(family.current_period_end).toLocaleDateString('ar-SA')}
          </AppText>
        )}

        <Card style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">منح باقة يدويًا</AppText>
          <AppText variant="caption" color="secondary">
            يغيّر باقة هذا العميل مباشرة بدون مرور بالدفع — للدعم أو العروض الخاصة.
          </AppText>

          <AppText variant="label" color="secondary">
            الباقة
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {activePlans.map((plan) => (
              <Chip
                key={plan.id}
                label={plan.name}
                selected={selectedPlanId === plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </View>

          <AppText variant="label" color="secondary" style={{ marginTop: theme.spacing.xs }}>
            المدة
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {DURATIONS.map((d) => (
              <Chip key={d.key} label={d.label} selected={selectedDuration === d.key} onPress={() => setSelectedDuration(d.key)} />
            ))}
          </View>

          <Button
            label="تطبيق"
            onPress={handleGrant}
            loading={granting}
            disabled={!selectedPlanId}
            style={{ marginTop: theme.spacing.xs }}
          />
        </Card>

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            سجل المدفوعات
          </AppText>
          {paymentsQuery.data?.length === 0 && <AppText color="secondary">لا توجد مدفوعات بعد</AppText>}
          <View style={{ gap: theme.spacing.xs }}>
            {paymentsQuery.data?.map((p) => (
              <Card key={p.id} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodyBold">{p.plan_name}</AppText>
                  <Badge label={statusLabel[p.status] ?? p.status} tone={p.status === 'succeeded' ? 'success' : 'warning'} />
                </View>
                <AppText variant="caption" color="secondary">
                  {p.amount_net} {p.currency} {p.amount_discount > 0 ? `(بعد خصم ${p.amount_discount})` : ''}
                </AppText>
                <AppText variant="caption" color="tertiary">
                  {new Date(p.created_at).toLocaleString('ar-SA')}
                </AppText>
              </Card>
            ))}
          </View>
        </View>

        {redemptionsQuery.data && redemptionsQuery.data.length > 0 && (
          <View>
            <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
              أكواد الخصم المستخدمة
            </AppText>
            <View style={{ gap: theme.spacing.xs }}>
              {redemptionsQuery.data.map((r) => (
                <Card key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodyBold">{r.promo_code.code}</AppText>
                  <AppText color="success">-{r.discount_amount}</AppText>
                </Card>
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
