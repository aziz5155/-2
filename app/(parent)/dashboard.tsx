import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { Avatar, AppText, Badge, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import { getFamilyTodayStats, listPendingApprovals } from '@/services/tasks.service';
import { listPendingRedemptions } from '@/services/rewards.service';
import { useAuthStore } from '@/stores/auth.store';

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        gap: 6,
        width: 72,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} size={24} color={theme.colors.primary} />
      </View>
      <AppText variant="caption" align="center" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
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

  return (
    <Screen scroll onRefresh={() => familyQuery.refetch()} refreshing={familyQuery.isFetching}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">{t('dashboard.greeting', { name: appUser?.full_name?.split(' ')[0] || '' })}</AppText>

        {needsAttention && (
          <Card backgroundColor={theme.colors.warningMuted} elevation={0}>
            <AppText variant="subtitle" style={{ marginBottom: theme.spacing.xs }}>
              {t('dashboard.whatNeedsYou')}
            </AppText>
            {pendingApprovalsCount > 0 && (
              <Pressable
                onPress={() => router.push('/(parent)/approvals')}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}
              >
                <AppText>{t('dashboard.pendingApprovals')}</AppText>
                <Badge label={String(pendingApprovalsCount)} tone="warning" />
              </Pressable>
            )}
            {pendingRedemptionsCount > 0 && (
              <Pressable
                onPress={() => router.push('/(parent)/rewards')}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}
              >
                <AppText>{t('dashboard.pendingRedemptions')}</AppText>
                <Badge label={String(pendingRedemptionsCount)} tone="warning" />
              </Pressable>
            )}
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Card style={{ flex: 1 }} elevation={0} backgroundColor={theme.colors.successMuted}>
            <AppText variant="caption" color="secondary">
              {t('dashboard.todayCompleted')}
            </AppText>
            <AppText variant="title">{statsQuery.data?.completedToday ?? 0}</AppText>
          </Card>
          <Card style={{ flex: 1 }} elevation={0} backgroundColor={theme.colors.infoMuted}>
            <AppText variant="caption" color="secondary">
              {t('dashboard.todayRemaining')}
            </AppText>
            <AppText variant="title">
              {Math.max(0, (statsQuery.data?.dueToday ?? 0) - (statsQuery.data?.completedToday ?? 0))}
            </AppText>
          </Card>
          <Card style={{ flex: 1 }} elevation={0} backgroundColor={theme.colors.pointsMuted}>
            <AppText variant="caption" color="secondary">
              {t('dashboard.todayPoints')}
            </AppText>
            <AppText variant="title">{statsQuery.data?.pointsToday ?? 0}</AppText>
          </Card>
        </View>

        <View>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            {t('dashboard.quickActions')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <QuickAction icon="star" label={t('dashboard.addTask')} onPress={() => router.push('/(parent)/tasks/new')} />
            <QuickAction icon="sunrise" label={t('dashboard.addProgram')} onPress={() => router.push('/(parent)/programs')} />
            <QuickAction icon="gift" label={t('dashboard.addReward')} onPress={() => router.push('/(parent)/rewards/new')} />
            <QuickAction icon="flag" label={t('dashboard.addChallenge')} onPress={() => router.push('/(parent)/challenges')} />
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <AppText variant="subtitle">{t('children.title')}</AppText>
            <AppText color="brand" weight="semibold" onPress={() => router.push('/(parent)/children')}>
              {t('common.seeAll')}
            </AppText>
          </View>

          {childrenQuery.data?.length === 0 && (
            <EmptyState
              emoji="👶"
              title={t('children.noChildrenYet')}
              subtitle={t('children.noChildrenSubtitle')}
              actionLabel={t('children.addChild')}
              onAction={() => router.push('/(parent)/children/new')}
            />
          )}

          <View style={{ gap: theme.spacing.sm }}>
            {childrenQuery.data?.map((child) => {
              const level = getLevelInfo(child.lifetime_points);
              return (
                <Pressable key={child.id} onPress={() => router.push(`/(parent)/children/${child.id}`)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                    <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={52} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <AppText variant="bodyBold">{child.name}</AppText>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Badge label={`⭐ ${child.points_balance}`} tone="points" />
                        <Badge label={t('children.level') + ' ' + level.level} tone="primary" />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
