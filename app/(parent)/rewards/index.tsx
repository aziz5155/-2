import { View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyFamily } from '@/services/family.service';
import { decideRedemption, listPendingRedemptions, listRewards } from '@/services/rewards.service';

export default function RewardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const rewardsQuery = useQuery({ queryKey: ['rewards', familyId], queryFn: () => listRewards(familyId!), enabled: !!familyId });
  const pendingQuery = useQuery({
    queryKey: ['pending-redemptions', familyId],
    queryFn: () => listPendingRedemptions(familyId!),
    enabled: !!familyId,
  });

  const handleDecide = async (id: string, approve: boolean) => {
    try {
      await decideRedemption(id, approve);
      queryClient.invalidateQueries({ queryKey: ['pending-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    }
  };

  if (rewardsQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">{t('rewards.title')}</AppText>
          <Button label={t('rewards.newReward')} size="sm" onPress={() => router.push('/(parent)/rewards/new')} />
        </View>

        {pendingQuery.data && pendingQuery.data.length > 0 && (
          <View>
            <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
              {t('rewards.pendingRequests')}
            </AppText>
            <View style={{ gap: theme.spacing.xs }}>
              {pendingQuery.data.map((r) => (
                <Card key={r.id} style={{ gap: theme.spacing.xs }} backgroundColor={theme.colors.warningMuted} elevation={0}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                    <AppIcon name={r.reward_icon} size={22} color={theme.colors.warning} />
                    <AppText style={{ flex: 1 }}>
                      {r.child_name} — {r.reward_name} ({r.points_spent} {t('common.pointsShort')})
                    </AppText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                    <Button label={t('common.approve')} size="sm" style={{ flex: 1 }} onPress={() => handleDecide(r.id, true)} />
                    <Button
                      label={t('common.reject')}
                      size="sm"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => handleDecide(r.id, false)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {rewardsQuery.data?.length === 0 && (
          <EmptyState
            icon="gift"
            title={t('rewards.noRewards')}
            actionLabel={t('rewards.newReward')}
            onAction={() => router.push('/(parent)/rewards/new')}
          />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {rewardsQuery.data?.map((reward) => (
            <Card key={reward.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <AppIcon name={reward.icon} size={26} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{reward.name}</AppText>
                {reward.description && (
                  <AppText variant="caption" color="secondary" numberOfLines={1}>
                    {reward.description}
                  </AppText>
                )}
              </View>
              <Badge label={`${reward.cost_points} ⭐`} tone="points" />
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
