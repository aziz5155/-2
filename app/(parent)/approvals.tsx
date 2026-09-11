import { Alert, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Button, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyFamily } from '@/services/family.service';
import { decideTaskCompletion, listPendingApprovals } from '@/services/tasks.service';

export default function ApprovalsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const approvalsQuery = useQuery({
    queryKey: ['pending-approvals', familyId],
    queryFn: () => listPendingApprovals(familyId!),
    enabled: !!familyId,
  });

  const handleDecide = async (id: string, approve: boolean) => {
    try {
      await decideTaskCompletion(id, approve);
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['family-today-stats'] });
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    }
  };

  if (approvalsQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('dashboard.pendingApprovals')}</AppText>

        {approvalsQuery.data?.length === 0 && <EmptyState emoji="✅" title={t('dashboard.noPendingApprovals')} />}

        <View style={{ gap: theme.spacing.sm }}>
          {approvalsQuery.data?.map((approval) => (
            <Card key={approval.id} style={{ gap: theme.spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <AppIcon name={approval.task_icon} size={22} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{approval.task_title}</AppText>
                  <AppText variant="caption" color="secondary">
                    {approval.child_name} · {approval.task_points} {t('common.pointsShort')}
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                <Button label={t('common.approve')} size="sm" style={{ flex: 1 }} onPress={() => handleDecide(approval.id, true)} />
                <Button
                  label={t('common.reject')}
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => handleDecide(approval.id, false)}
                />
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
