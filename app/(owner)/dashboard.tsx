import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getOwnerDashboardStats } from '@/services/admin.service';

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card style={{ flex: 1 }} elevation={0} backgroundColor={color}>
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
      <AppText variant="title">{value}</AppText>
    </Card>
  );
}

export default function OwnerDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const statsQuery = useQuery({ queryKey: ['owner-stats'], queryFn: getOwnerDashboardStats });

  if (statsQuery.isLoading || !statsQuery.data) return <LoadingState />;
  const stats = statsQuery.data;

  return (
    <Screen scroll onRefresh={() => statsQuery.refetch()} refreshing={statsQuery.isFetching}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">لوحة المالك</AppText>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatCard label="إجمالي العائلات" value={stats.totalFamilies} color={theme.colors.infoMuted} />
          <StatCard label="على الخطة المجانية" value={stats.freeFamilies} color={theme.colors.surfaceMuted} />
          <StatCard label="مشتركون بريميوم" value={stats.premiumFamilies} color={theme.colors.primaryMuted} />
        </View>

        <Card backgroundColor={theme.colors.warningMuted} elevation={0} style={{ gap: 6 }}>
          <AppText variant="bodyBold">💳 حالة الدفع: بانتظار ربط بوابة دفع</AppText>
          <AppText variant="caption" color="secondary">
            لم يُربط أي مزوّد دفع بعد. كل الاشتراكات والأكواد تعمل فعليًا وتُسجَّل، لكن
            المبالغ لا تُحصَّل تلقائيًا الآن — راجع docs/EXTERNAL_SERVICES.md عند الاستعداد لربط
            بوابة دفع سعودية (Moyasar / Tap).
          </AppText>
          <AppText variant="caption" color="secondary">
            عدد العمليات المسجّلة: {stats.totalPayments} · القيمة الصافية بانتظار التحصيل:{' '}
            {stats.pendingProviderAmount.toFixed(2)} SAR
          </AppText>
        </Card>

        <View style={{ gap: theme.spacing.sm }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/customers')}>
              👥 إدارة العملاء
            </AppText>
          </Card>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/plans')}>
              🏷️ الباقات والأسعار
            </AppText>
          </Card>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/promo-codes')}>
              🎟️ أكواد الخصم
            </AppText>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
