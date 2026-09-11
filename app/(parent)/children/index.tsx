import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, AppText, Badge, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';

export default function ChildrenListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const childrenQuery = useQuery({
    queryKey: ['children', familyId],
    queryFn: () => listChildren(familyId!),
    enabled: !!familyId,
  });

  if (childrenQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="display">{t('children.title')}</AppText>
          <Button label={t('children.addChild')} size="sm" onPress={() => router.push('/(parent)/children/new')} />
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
                  <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={56} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText variant="bodyBold">{child.name}</AppText>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Badge label={`⭐ ${child.points_balance}`} tone="points" />
                      <Badge label={`${t('children.level')} ${level.level}`} tone="primary" />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
