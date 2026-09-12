import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listChallenges } from '@/services/challenges.service';
import { getMyFamily } from '@/services/family.service';

export default function ChallengesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const challengesQuery = useQuery({
    queryKey: ['challenges', familyId],
    queryFn: () => listChallenges(familyId!),
    enabled: !!familyId,
  });

  if (challengesQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">{t('challenges.title')}</AppText>
          <Button label={t('challenges.newChallenge')} size="sm" onPress={() => router.push('/(parent)/challenges/new')} />
        </View>

        {challengesQuery.data?.length === 0 && (
          <EmptyState icon="flag" title={t('challenges.title')} actionLabel={t('challenges.newChallenge')} onAction={() => router.push('/(parent)/challenges/new')} />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {challengesQuery.data?.map((challenge) => {
            const days = Math.round(
              (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / 86400000,
            ) + 1;
            return (
              <Card key={challenge.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <AppIcon name={challenge.icon} size={24} color={theme.colors.primary} />
                  <AppText variant="bodyBold" style={{ flex: 1 }}>
                    {challenge.name}
                  </AppText>
                  <Badge label={t('challenges.duration', { days })} tone="info" />
                </View>
                {challenge.description && (
                  <AppText variant="caption" color="secondary">
                    {challenge.description}
                  </AppText>
                )}
                <Badge label={`${t('challenges.reward')}: ${challenge.reward_points} ⭐`} tone="points" />
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
