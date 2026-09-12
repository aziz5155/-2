import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Card, ChildSummaryCard, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import { getFamilyTodayStats, listPendingApprovals } from '@/services/tasks.service';
import { listPendingRedemptions } from '@/services/rewards.service';
import { useAuthStore } from '@/stores/auth.store';

function StatTile({ label, value, tint, iconColor, icon }: { label: string; value: number; tint: string; iconColor: string; icon: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, gap: theme.spacing.xxs }} elevation={0} backgroundColor={tint}>
      <AppIcon name={icon} size={16} color={iconColor} />
      <AppText variant="title" style={{ marginTop: 2 }}>
        {value}
      </AppText>
      <AppText variant="label" color="secondary" numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

function ActionRow({ icon, label, count, onPress }: { icon: string; label: string; count: number; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} size={16} color={theme.colors.warning} />
      </View>
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <Badge label={String(count)} tone="warning" />
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 6, width: 72 }}>
      {({ pressed }) => (
        <>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            }}
          >
            <AppIcon name={icon} size={22} color={theme.colors.primary} />
          </View>
          <AppText variant="label" align="center" numberOfLines={1}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText variant="subtitle">{title}</AppText>
      {actionLabel && onAction ? (
        <AppText color="brand" weight="semibold" variant="caption" onPress={onAction}>
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const childrenQuery = useQuery({
    queryKey: ['children', familyId],
    queryFn: () => listChildren(familyId!),
    enabled: !!familyId,
  });

  const approvalsQuery = useQuery({
    queryKey: ['pending-approvals', familyId],
    queryFn: () => listPendingApprovals(familyId!),
    enabled: !!familyId,
  });

  const redemptionsQuery = useQuery({
    queryKey: ['pending-redemptions', familyId],
    queryFn: () => listPendingRedemptions(familyId!),
    enabled: !!familyId,
  });

  const statsQuery = useQuery({
    queryKey: ['family-today-stats', familyId],
    queryFn: () => getFamilyTodayStats(familyId!),
    enabled: !!familyId,
  });

  if (familyQuery.isLoading) return <LoadingState />;

  const pendingApprovalsCount = approvalsQuery.data?.length ?? 0;
  const pendingRedemptionsCount = redemptionsQuery.data?.length ?? 0;
  const needsAttention = pendingApprovalsCount + pendingRedemptionsCount > 0;
  const firstName = appUser?.full_name?.split(' ')[0] || '';

  return (
    <Screen scroll onRefresh={() => familyQuery.refetch()} refreshing={familyQuery.isFetching}>
      <View style={{ gap: theme.spacing.xl }}>
        <View style={{ gap: 2 }}>
          <AppText variant="title">{t('dashboard.greeting', { name: firstName })}</AppText>
          <AppText variant="caption" color="secondary">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile
            label={t('dashboard.todayCompleted')}
            value={statsQuery.data?.completedToday ?? 0}
            tint={theme.colors.successMuted}
            iconColor={theme.colors.success}
            icon="checkmark"
          />
          <StatTile
            label={t('dashboard.todayRemaining')}
            value={Math.max(0, (statsQuery.data?.dueToday ?? 0) - (statsQuery.data?.completedToday ?? 0))}
            tint={theme.colors.infoMuted}
            iconColor={theme.colors.info}
            icon="calendar"
          />
          <StatTile
            label={t('dashboard.todayPoints')}
            value={statsQuery.data?.pointsToday ?? 0}
            tint={theme.colors.pointsMuted}
            iconColor={theme.colors.points}
            icon="star"
          />
        </View>

        {needsAttention && (
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={t('dashboard.whatNeedsYou')} />
            <Card elevation={0} bordered style={{ paddingVertical: theme.spacing.xs }}>
              {pendingApprovalsCount > 0 && (
                <ActionRow
                  icon="checkmark"
                  label={t('dashboard.pendingApprovals')}
                  count={pendingApprovalsCount}
                  onPress={() => router.push('/(parent)/approvals')}
                />
              )}
              {pendingRedemptionsCount > 0 && (
                <ActionRow
                  icon="gift"
                  label={t('dashboard.pendingRedemptions')}
                  count={pendingRedemptionsCount}
                  onPress={() => router.push('/(parent)/rewards')}
                />
              )}
            </Card>
          </View>
        )}

        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('activity.title')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(parent)/activity')} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('children.title')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(parent)/children')} />

          {childrenQuery.data?.length === 0 ? (
            <EmptyState
              icon="people"
              title={t('children.noChildrenYet')}
              subtitle={t('children.noChildrenSubtitle')}
              actionLabel={t('children.addChild')}
              onAction={() => router.push('/(parent)/children/new')}
            />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {childrenQuery.data?.map((child) => (
                <ChildSummaryCard key={child.id} child={child} onPress={() => router.push(`/(parent)/children/${child.id}`)} />
              ))}
            </View>
          )}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={t('dashboard.quickActions')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <QuickAction icon="star" label={t('dashboard.addTask')} onPress={() => router.push('/(parent)/tasks/new')} />
            <QuickAction icon="sunrise" label={t('dashboard.addProgram')} onPress={() => router.push('/(parent)/programs')} />
            <QuickAction icon="gift" label={t('dashboard.addReward')} onPress={() => router.push('/(parent)/rewards/new')} />
            <QuickAction icon="flag" label={t('dashboard.addChallenge')} onPress={() => router.push('/(parent)/challenges')} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
