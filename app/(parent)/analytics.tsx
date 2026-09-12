import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { useIsRTL } from '@/stores/locale.store';
import {
  AppText,
  Avatar,
  Badge,
  Card,
  EmptyState,
  PeriodFilter,
  Screen,
  StatCard,
} from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getFamilyInsights, getChildAnalytics, ChildAnalytics } from '@/services/analytics.service';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import { listGoals } from '@/services/goals.service';
import { listAchievementCatalog, listChildAchievements } from '@/services/achievements.service';
import { getStreak } from '@/services/streaks.service';
import { PeriodKey, resolvePeriod, percentChange } from '@/utils/dateRanges';
import { generateChildInsights } from '@/utils/parentInsights';
import { Child } from '@/types/models';

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="subtitle" style={{ marginBottom: 4 }}>
      {children}
    </AppText>
  );
}

function InsightsList({ notes }: { notes: string[] }) {
  const theme = useTheme();
  if (notes.length === 0) return null;
  return (
    <Card style={{ gap: theme.spacing.xs, backgroundColor: theme.colors.primaryMuted }} elevation={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AppIcon name="sparkles" size={16} color={theme.colors.primary} />
        <AppText variant="bodyBold" style={{ color: theme.colors.primaryText }}>
          ملاحظات لولي الأمر
        </AppText>
      </View>
      {notes.map((n, i) => (
        <AppText key={i} variant="caption" style={{ color: theme.colors.primaryText }}>
          • {n}
        </AppText>
      ))}
    </Card>
  );
}

function ChildDetail({ child, range, prevRange }: { child: Child; range: { start: string; end: string }; prevRange: { start: string; end: string } }) {
  const theme = useTheme();

  const currentQuery = useQuery({ queryKey: ['child-analytics', child.id, range], queryFn: () => getChildAnalytics(child.id, range) });
  const previousQuery = useQuery({ queryKey: ['child-analytics', child.id, prevRange], queryFn: () => getChildAnalytics(child.id, prevRange) });
  const streakQuery = useQuery({ queryKey: ['streak', child.id], queryFn: () => getStreak(child.id) });
  const goalsQuery = useQuery({ queryKey: ['goals', child.id], queryFn: () => listGoals(child.id) });
  const achievementsQuery = useQuery({ queryKey: ['child-achievements', child.id], queryFn: () => listChildAchievements(child.id) });
  const catalogQuery = useQuery({ queryKey: ['achievement-catalog'], queryFn: listAchievementCatalog });

  if (currentQuery.isLoading || !currentQuery.data) return <LoadingState />;
  const c = currentQuery.data;
  const prev = previousQuery.data;

  const notes = prev
    ? generateChildInsights({
        childName: child.name,
        current: c,
        previous: prev,
        goals: goalsQuery.data?.map((g) => ({ name: g.name, target_points: g.target_points, is_achieved: g.is_achieved })),
        pointsBalance: child.points_balance,
      })
    : [];

  const unlockedIds = new Set((achievementsQuery.data ?? []).map((a) => a.achievement_id));
  const unlockedAchievements = (catalogQuery.data ?? []).filter((a) => unlockedIds.has(a.id));

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <StatCard
          icon="checkmark"
          label="نسبة الإنجاز"
          value={c.completion_rate !== null ? `${c.completion_rate}%` : '—'}
          change={prev ? percentChange(c.completion_rate ?? 0, prev.completion_rate ?? 0) : undefined}
        />
        <StatCard icon="star" label="نقاط مكتسبة" value={c.points_earned} tint={theme.colors.pointsMuted} />
        <StatCard icon="gift" label="نقاط مصروفة" value={c.points_spent} />
        <StatCard icon="flame" label="السلسلة الحالية" value={streakQuery.data?.current_streak ?? 0} tint={theme.colors.streakMuted} />
      </View>

      <InsightsList notes={notes} />

      <Card style={{ gap: 4 }}>
        <AppText variant="caption" color="secondary">
          أفضل سلسلة التزام: {streakQuery.data?.longest_streak ?? 0} يوم
        </AppText>
        <AppText variant="caption" color="secondary">
          مهام مسجّلة: {c.completions_recorded} · معتمدة: {c.completions_approved} · مكافآت مستبدلة: {c.rewards_redeemed}
        </AppText>
      </Card>

      {c.most_consistent_program && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <AppIcon name="sunrise" size={20} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">{c.most_consistent_program.name}</AppText>
            <AppText variant="caption" color="secondary">
              البرنامج الأكثر انتظامًا · {c.most_consistent_program.completed_count} مهمة منجزة
            </AppText>
          </View>
        </Card>
      )}

      {c.most_missed_tasks.length > 0 && (
        <View style={{ gap: 6 }}>
          <SectionTitle>مهام تتكرر دون إنجاز</SectionTitle>
          {c.most_missed_tasks.map((t) => (
            <Card key={t.title} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText>{t.title}</AppText>
              <Badge label={`${t.miss_count} مرات`} tone="danger" />
            </Card>
          ))}
        </View>
      )}

      {c.points_by_reason.length > 0 && (
        <View style={{ gap: 6 }}>
          <SectionTitle>مصدر النقاط</SectionTitle>
          {c.points_by_reason.map((p) => (
            <Card key={p.reason} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText numberOfLines={1} style={{ flex: 1 }}>
                {p.reason}
              </AppText>
              <AppText weight="semibold" color="success">
                +{p.total}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      {goalsQuery.data && goalsQuery.data.length > 0 && (
        <View style={{ gap: 6 }}>
          <SectionTitle>أهداف الادخار</SectionTitle>
          {goalsQuery.data.map((g) => (
            <Card key={g.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText>{g.name}</AppText>
              <Badge
                label={g.is_achieved ? 'تحقق' : `${child.points_balance}/${g.target_points}`}
                tone={g.is_achieved ? 'success' : 'neutral'}
              />
            </Card>
          ))}
        </View>
      )}

      {unlockedAchievements.length > 0 && (
        <View style={{ gap: 6 }}>
          <SectionTitle>الإنجازات</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {unlockedAchievements.map((a) => (
              <Badge key={a.id} label={a.name} tone="primary" icon={<AppIcon name={a.icon} size={13} color={theme.colors.primaryText} />} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function FamilyAnalyticsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [selectedChildId, setSelectedChildId] = useState<string | 'all'>('all');

  const { current: range, previous: prevRange } = useMemo(() => resolvePeriod(period), [period]);

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const childrenQuery = useQuery({
    queryKey: ['children', familyId],
    queryFn: () => listChildren(familyId!),
    enabled: !!familyId,
  });

  const summaryQuery = useQuery({
    queryKey: ['family-insights', familyId, range],
    queryFn: () => getFamilyInsights(familyId!, range),
    enabled: !!familyId,
  });
  const prevSummaryQuery = useQuery({
    queryKey: ['family-insights', familyId, prevRange],
    queryFn: () => getFamilyInsights(familyId!, prevRange),
    enabled: !!familyId,
  });

  if (childrenQuery.isLoading || summaryQuery.isLoading) return <LoadingState />;

  const children = childrenQuery.data ?? [];
  const summary = summaryQuery.data;
  const prevSummary = prevSummaryQuery.data;
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('analytics.title')}</AppText>

        <PeriodFilter value={period} onChange={setPeriod} />

        {summary && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <StatCard
              icon="checkmark"
              label="مهام منجزة"
              value={summary.completed_count}
              change={prevSummary ? percentChange(summary.completed_count, prevSummary.completed_count) : undefined}
            />
            <StatCard icon="star" label="نقاط مكتسبة" value={summary.points_earned} tint={theme.colors.pointsMuted} />
            <StatCard icon="gift" label="نقاط مصروفة" value={summary.points_spent} />
            <StatCard icon="calendar" label="أيام نشطة" value={summary.active_days} />
            <StatCard icon="ticket" label="مكافآت مُستلمة" value={summary.rewards_redeemed} />
          </View>
        )}

        {children.length === 0 ? (
          <EmptyState icon="people" title="لا يوجد أبناء بعد" />
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                onPress={() => setSelectedChildId('all')}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.pill,
                  backgroundColor: selectedChildId === 'all' ? theme.colors.primary : theme.colors.surfaceMuted,
                }}
              >
                <AppText style={{ color: selectedChildId === 'all' ? '#fff' : theme.colors.textPrimary }} weight="semibold">
                  كل الأبناء
                </AppText>
              </Pressable>
              {children.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedChildId(c.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: theme.radius.pill,
                    backgroundColor: selectedChildId === c.id ? theme.colors.primary : theme.colors.surfaceMuted,
                  }}
                >
                  <Avatar name={c.name} uri={c.avatar_url} size={22} />
                  <AppText style={{ color: selectedChildId === c.id ? '#fff' : theme.colors.textPrimary }} weight="semibold">
                    {c.name}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {selectedChild ? (
              <ChildDetail child={selectedChild} range={range} prevRange={prevRange} />
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {children.map((c) => (
                  <Pressable key={c.id} onPress={() => setSelectedChildId(c.id)}>
                    <ChildRow child={c} range={range} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function ChildRow({ child, range }: { child: Child; range: { start: string; end: string } }) {
  const theme = useTheme();
  const rtl = useIsRTL();
  const { data } = useQuery<ChildAnalytics>({ queryKey: ['child-analytics', child.id, range], queryFn: () => getChildAnalytics(child.id, range) });

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      <Avatar name={child.name} uri={child.avatar_url} size={40} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{child.name}</AppText>
        <AppText variant="caption" color="secondary">
          نسبة الإنجاز: {data?.completion_rate !== null && data?.completion_rate !== undefined ? `${data.completion_rate}%` : '—'}
        </AppText>
      </View>
      <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.colors.textTertiary} />
    </Card>
  );
}
