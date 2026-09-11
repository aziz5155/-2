import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { AppText, Badge, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getCustomerDetail, listFamilyPayments, listFamilyRedemptions } from '@/services/admin.service';

export default function CustomerDetailScreen() {
  const { familyId } = useLocalSearchParams<{ familyId: string }>();
  const theme = useTheme();

  const detailQuery = useQuery({ queryKey: ['customer-detail', familyId], queryFn: () => getCustomerDetail(familyId!) });
  const paymentsQuery = useQuery({ queryKey: ['customer-payments', familyId], queryFn: () => listFamilyPayments(familyId!) });
  const redemptionsQuery = useQuery({ queryKey: ['customer-redemptions', familyId], queryFn: () => listFamilyRedemptions(familyId!) });

  if (detailQuery.isLoading || !detailQuery.data) return <LoadingState />;
  const family = detailQuery.data;

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
