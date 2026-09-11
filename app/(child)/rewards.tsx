import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyChildProfile } from '@/services/children.service';
import { listChildRedemptions, listRewards, requestRedemption } from '@/services/rewards.service';

export default function ChildRewardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const childQuery = useQuery({ queryKey: ['my-child-profile'], queryFn: getMyChildProfile });
  const child = childQuery.data;

  const rewardsQuery = useQuery({
    queryKey: ['rewards', child?.family_id],
    queryFn: () => listRewards(child!.family_id),
    enabled: !!child,
  });

  const redemptionsQuery = useQuery({
    queryKey: ['my-redemptions', child?.id],
    queryFn: () => listChildRedemptions(child!.id),
    enabled: !!child,
  });

  const handleRedeem = (rewardId: string, name: string, cost: number) => {
    if (!child || child.points_balance < cost) {
      Alert.alert(t('rewards.insufficientPoints'));
      return;
    }
    Alert.alert(t('rewards.redeem'), t('rewards.redeemConfirm', { cost, name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('rewards.redeem'),
        onPress: async () => {
          try {
            await requestRedemption(rewardId);
            Alert.alert(t('rewards.requestSent'));
            queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
          } catch (e) {
            Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  };

  if (rewardsQuery.isLoading || !child) return <LoadingState />;

  const pendingRedemptions = redemptionsQuery.data?.filter((r) => r.status === 'pending') ?? [];

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">{t('rewards.title')}</AppText>
          <Badge label={`⭐ ${child.points_balance}`} tone="points" />
        </View>

        {pendingRedemptions.length > 0 && (
          <Card backgroundColor={theme.colors.warningMuted} elevation={0}>
            <AppText variant="caption">{t('rewards.pendingRequests')}: {pendingRedemptions.length}</AppText>
          </Card>
        )}

        {rewardsQuery.data?.length === 0 && <EmptyState emoji="🎁" title={t('rewards.noRewards')} />}

        <View style={{ gap: theme.spacing.sm }}>
          {rewardsQuery.data?.map((reward) => {
            const canAfford = child.points_balance >= reward.cost_points;
            const outOfStock = reward.usage_limit !== null && reward.times_redeemed >= reward.usage_limit;
            return (
              <Card key={reward.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, opacity: outOfStock ? 0.5 : 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.pointsMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name={reward.icon} size={24} color={theme.colors.points} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{reward.name}</AppText>
                  <AppText variant="caption" color="secondary">
                    ⭐ {reward.cost_points}
                  </AppText>
                </View>
                <Button
                  label={outOfStock ? t('rewards.notAvailable') : t('rewards.redeem')}
                  size="sm"
                  disabled={!canAfford || outOfStock}
                  onPress={() => handleRedeem(reward.id, reward.name, reward.cost_points)}
                />
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
