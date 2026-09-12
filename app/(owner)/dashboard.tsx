import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Card, PeriodFilter, Screen, StatCard } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import {
  getOwnerOverviewStats,
  getOwnerEngagementStats,
  getOwnerRetentionStats,
  getOwnerTaskStats,
  getOwnerPointsStats,
  getOwnerRewardsStats,
  getOwnerFeatureUsage,
  getOwnerTopTemplates,
  getOwnerFunnelStats,
  getOwnerSubscriptionStats,
} from '@/services/admin.service';
import { PeriodKey, resolvePeriod, percentChange } from '@/utils/dateRanges';

const FUNNEL_LABELS: Record<string, string> = {
  signed_up: 'سجّلوا حسابًا',
  created_family: 'أنشأوا عائلة',
  added_child: 'أضافوا طفلًا',
  created_first_task: 'أنشأوا أول مهمة',
  granted_first_points: 'منحوا أول نقاط',
  created_first_reward: 'أنشأوا أول مكافأة',
  returned_after_signup: 'عادوا لاستخدام التطبيق',
};

const EVENT_LABELS: Record<string, string> = {
  app_opened: 'فتح التطبيق',
  signup: 'تسجيل حساب',
  family_created: 'إنشاء عائلة',
  child_added: 'إضافة طفل',
  task_created: 'إنشاء مهمة',
  task_completed: 'إنجاز مهمة',
  points_granted: 'منح نقاط',
  points_spent: 'صرف نقاط',
  reward_created: 'إنشاء مكافأة',
  reward_requested: 'طلب استبدال مكافأة',
  reward_redeemed: 'استبدال مكافأة',
  subscription_upgraded: 'ترقية اشتراك',
  subscription_canceled: 'إلغاء اشتراك',
};

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="subtitle" style={{ marginBottom: 4 }}>
      {children}
    </AppText>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const theme = useTheme();
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="caption" weight="semibold">
          {value}
        </AppText>
      </View>
      <View style={{ height: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceMuted }}>
        <View style={{ height: 8, width: `${width}%`, borderRadius: theme.radius.pill, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function OwnerDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const { current: range, previous: prevRange } = useMemo(() => resolvePeriod(period), [period]);

  const overviewQuery = useQuery({ queryKey: ['owner-overview', range], queryFn: () => getOwnerOverviewStats(range) });
  const prevOverviewQuery = useQuery({ queryKey: ['owner-overview', prevRange], queryFn: () => getOwnerOverviewStats(prevRange) });
  const engagementQuery = useQuery({ queryKey: ['owner-engagement'], queryFn: getOwnerEngagementStats });
  const retentionQuery = useQuery({ queryKey: ['owner-retention'], queryFn: getOwnerRetentionStats });
  const taskStatsQuery = useQuery({ queryKey: ['owner-tasks', range], queryFn: () => getOwnerTaskStats(range) });
  const prevTaskStatsQuery = useQuery({ queryKey: ['owner-tasks', prevRange], queryFn: () => getOwnerTaskStats(prevRange) });
  const pointsStatsQuery = useQuery({ queryKey: ['owner-points', range], queryFn: () => getOwnerPointsStats(range) });
  const rewardsStatsQuery = useQuery({ queryKey: ['owner-rewards', range], queryFn: () => getOwnerRewardsStats(range) });
  const featureUsageQuery = useQuery({ queryKey: ['owner-feature-usage', range], queryFn: () => getOwnerFeatureUsage(range) });
  const templatesQuery = useQuery({ queryKey: ['owner-templates', range], queryFn: () => getOwnerTopTemplates(range) });
  const funnelQuery = useQuery({ queryKey: ['owner-funnel', range], queryFn: () => getOwnerFunnelStats(range) });
  const subsQuery = useQuery({ queryKey: ['owner-subs', range], queryFn: () => getOwnerSubscriptionStats(range) });
  const prevSubsQuery = useQuery({ queryKey: ['owner-subs', prevRange], queryFn: () => getOwnerSubscriptionStats(prevRange) });

  if (overviewQuery.isLoading) return <LoadingState />;
  const overview = overviewQuery.data;
  const prevOverview = prevOverviewQuery.data;
  const engagement = engagementQuery.data;
  const retention = retentionQuery.data;
  const taskStats = taskStatsQuery.data;
  const prevTaskStats = prevTaskStatsQuery.data;
  const subs = subsQuery.data;
  const prevSubs = prevSubsQuery.data;

  const maxFunnel = funnelQuery.data?.[0]?.account_count ?? 1;
  const maxFeature = featureUsageQuery.data?.[0]?.usage_count ?? 1;

  // Product health: a handful of plain-language flags derived from the same
  // numbers above, not a separate data source.
  const healthNotes: string[] = [];
  if (engagement && engagement.dormant_accounts > 0) {
    healthNotes.push(`${engagement.dormant_accounts} حسابًا لم تُستخدم منذ 30 يومًا`);
  }
  if (taskStats?.completion_rate !== null && taskStats?.completion_rate !== undefined && prevTaskStats?.completion_rate !== null && prevTaskStats?.completion_rate !== undefined) {
    const diff = taskStats.completion_rate - prevTaskStats.completion_rate;
    if (diff <= -5) healthNotes.push(`انخفض معدل اعتماد المهام ${Math.abs(Math.round(diff))}% مقارنة بالفترة السابقة`);
  }
  if (subs && prevSubs && subs.canceled_in_period > prevSubs.canceled_in_period) {
    healthNotes.push(`ارتفعت إلغاءات الاشتراك من ${prevSubs.canceled_in_period} إلى ${subs.canceled_in_period}`);
  }
  if (featureUsageQuery.data && featureUsageQuery.data.length > 0) {
    const least = featureUsageQuery.data[featureUsageQuery.data.length - 1];
    if (least.usage_count <= 2) healthNotes.push(`ميزة "${EVENT_LABELS[least.event_type] ?? least.event_type}" تكاد لا تُستخدم`);
  }
  if (funnelQuery.data && funnelQuery.data.length > 1) {
    let worstDrop = { from: '', to: '', pct: 0 };
    for (let i = 1; i < funnelQuery.data.length; i++) {
      const prev = funnelQuery.data[i - 1];
      const cur = funnelQuery.data[i];
      if (prev.account_count === 0) continue;
      const dropPct = Math.round((1 - cur.account_count / prev.account_count) * 100);
      if (dropPct > worstDrop.pct) worstDrop = { from: FUNNEL_LABELS[prev.step] ?? prev.step, to: FUNNEL_LABELS[cur.step] ?? cur.step, pct: dropPct };
    }
    if (worstDrop.pct >= 30) healthNotes.push(`أكبر تسرب بالتسجيل بين "${worstDrop.from}" و"${worstDrop.to}" (${worstDrop.pct}%)`);
  }

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">لوحة المالك</AppText>

        <PeriodFilter value={period} onChange={setPeriod} />

        {/* Top 6 KPIs */}
        {overview && engagement && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <StatCard
              icon="people"
              label="إجمالي المستخدمين"
              value={overview.total_users}
              change={prevOverview ? percentChange(overview.new_users, prevOverview.new_users) : undefined}
            />
            <StatCard icon="people" label="العائلات" value={overview.total_families} />
            <StatCard icon="checkmark" label="نشطون اليوم (DAU)" value={engagement.dau} />
            <StatCard icon="calendar" label="نشطون أسبوعيًا (WAU)" value={engagement.wau} />
            <StatCard icon="chart" label="نشطون شهريًا (MAU)" value={engagement.mau} />
            <StatCard icon="flame" label="عودة (30 يوم)" value={retention?.retention_rate !== null && retention?.retention_rate !== undefined ? `${retention.retention_rate}%` : '—'} />
          </View>
        )}

        {healthNotes.length > 0 && (
          <Card style={{ gap: theme.spacing.xs, backgroundColor: theme.colors.warningMuted }} elevation={0}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="chart" size={16} color={theme.colors.warning} />
              <AppText variant="bodyBold">صحة المنتج</AppText>
            </View>
            {healthNotes.map((n, i) => (
              <AppText key={i} variant="caption" color="secondary">
                • {n}
              </AppText>
            ))}
          </Card>
        )}

        {/* Funnel */}
        <View style={{ gap: 6 }}>
          <SectionTitle>رحلة العميل</SectionTitle>
          <Card style={{ gap: theme.spacing.sm }}>
            {funnelQuery.data?.map((step) => (
              <BarRow
                key={step.step}
                label={FUNNEL_LABELS[step.step] ?? step.step}
                value={step.account_count}
                max={maxFunnel}
                color={theme.colors.primary}
              />
            ))}
          </Card>
        </View>

        {/* Subscriptions */}
        <View style={{ gap: 6 }}>
          <SectionTitle>الاشتراكات</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <StatCard icon="people" label="مجاني" value={subs?.free_count ?? 0} />
            <StatCard icon="star" label="Plus" value={subs?.plus_count ?? 0} tint={theme.colors.pointsMuted} />
            <StatCard icon="trophy" label="Pro" value={subs?.pro_count ?? 0} tint={theme.colors.pointsMuted} />
            <StatCard icon="checkmark" label="اشتراكات مدفوعة جديدة" value={subs?.new_paid_in_period ?? 0} />
            <StatCard icon="trash" label="إلغاءات" value={subs?.canceled_in_period ?? 0} />
            <StatCard icon="chart" label="Churn" value={subs?.churn_rate !== null && subs?.churn_rate !== undefined ? `${subs.churn_rate}%` : '—'} />
          </View>
          <Card backgroundColor={theme.colors.surfaceMuted} elevation={0}>
            <AppText variant="caption" color="secondary">
              💳 MRR والإيرادات الفعلية تحتاج ربط بوابة دفع — لا تُعرض أرقام تقديرية. راجع docs/EXTERNAL_SERVICES.md.
            </AppText>
          </Card>
        </View>

        {/* Tasks, points, rewards */}
        <View style={{ gap: 6 }}>
          <SectionTitle>المهام والبرامج والنقاط</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <StatCard icon="star" label="مهام أُنشئت" value={taskStats?.tasks_created ?? 0} />
            <StatCard icon="sunrise" label="برامج أُنشئت" value={taskStats?.programs_created ?? 0} />
            <StatCard
              icon="checkmark"
              label="معدل اعتماد المهام"
              value={taskStats?.completion_rate !== null && taskStats?.completion_rate !== undefined ? `${taskStats.completion_rate}%` : '—'}
            />
            <StatCard icon="star" label="نقاط مُنحت" value={pointsStatsQuery.data?.points_granted ?? 0} tint={theme.colors.pointsMuted} />
            <StatCard icon="gift" label="نقاط صُرفت" value={pointsStatsQuery.data?.points_spent ?? 0} />
            <StatCard icon="ticket" label="مكافآت أُنشئت" value={rewardsStatsQuery.data?.rewards_created ?? 0} />
            <StatCard icon="ticket" label="مكافآت استُبدلت" value={rewardsStatsQuery.data?.redemptions_approved ?? 0} />
          </View>
        </View>

        {/* Feature usage + top templates */}
        <View style={{ gap: 6 }}>
          <SectionTitle>أكثر الميزات استخدامًا</SectionTitle>
          <Card style={{ gap: theme.spacing.sm }}>
            {featureUsageQuery.data?.slice(0, 8).map((f) => (
              <BarRow key={f.event_type} label={EVENT_LABELS[f.event_type] ?? f.event_type} value={f.usage_count} max={maxFeature} color={theme.colors.info} />
            ))}
            {(featureUsageQuery.data?.length ?? 0) === 0 && (
              <AppText variant="caption" color="tertiary">
                لا توجد بيانات كافية بعد لهذه الفترة
              </AppText>
            )}
          </Card>
        </View>

        {templatesQuery.data && templatesQuery.data.length > 0 && (
          <View style={{ gap: 6 }}>
            <SectionTitle>أكثر القوالب استخدامًا</SectionTitle>
            <Card style={{ gap: 6 }}>
              {templatesQuery.data.map((t) => (
                <View key={t.template_name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText>{t.template_name}</AppText>
                  <Badge label={String(t.usage_count)} tone="primary" />
                </View>
              ))}
            </Card>
          </View>
        )}

        {overview && (
          <Card backgroundColor={theme.colors.surfaceMuted} elevation={0} style={{ gap: 4 }}>
            <AppText variant="caption" color="secondary">
              متوسط الأبناء لكل عائلة: {overview.avg_children_per_family} · إجمالي الأبناء: {overview.total_children}
            </AppText>
          </Card>
        )}

        <View style={{ gap: theme.spacing.sm }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/customers')}>
              إدارة العملاء
            </AppText>
          </Card>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/plans')}>
              الباقات والأسعار
            </AppText>
          </Card>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText style={{ flex: 1 }} onPress={() => router.push('/(owner)/promo-codes')}>
              أكواد الخصم
            </AppText>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
