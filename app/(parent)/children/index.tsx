import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, ChildSummaryCard, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
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
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="title">{t('children.title')}</AppText>
          <Button label={t('children.addChild')} size="sm" onPress={() => router.push('/(parent)/children/new')} />
        </View>

        {childrenQuery.data?.length === 0 && (
          <EmptyState
            icon="people"
            title={t('children.noChildrenYet')}
            subtitle={t('children.noChildrenSubtitle')}
            actionLabel={t('children.addChild')}
            onAction={() => router.push('/(parent)/children/new')}
          />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {childrenQuery.data?.map((child) => (
            <ChildSummaryCard key={child.id} child={child} onPress={() => router.push(`/(parent)/children/${child.id}`)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
