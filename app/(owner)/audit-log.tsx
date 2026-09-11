import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText, Card, EmptyState, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listAuditLog } from '@/services/admin.service';

export default function AuditLogScreen() {
  const theme = useTheme();
  const auditQuery = useQuery({ queryKey: ['audit-log'], queryFn: () => listAuditLog(100) });

  if (auditQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">سجل التدقيق</AppText>
        <AppText variant="caption" color="secondary">
          كل تعديل على الباقات وأكواد الخصم وفريق الإدارة يُسجَّل هنا تلقائيًا — من غيّر، ماذا، ومتى.
        </AppText>

        {auditQuery.data?.length === 0 && <EmptyState emoji="📋" title="لا يوجد سجل بعد" />}

        <View style={{ gap: theme.spacing.xs }}>
          {auditQuery.data?.map((entry) => (
            <Card key={entry.id} elevation={0} style={{ gap: 4 }}>
              <AppText variant="bodyBold">{entry.action}</AppText>
              {entry.target_type && (
                <AppText variant="caption" color="secondary">
                  {entry.target_type} · {entry.target_id}
                </AppText>
              )}
              <AppText variant="caption" color="tertiary">
                {new Date(entry.created_at).toLocaleString('ar-SA')}
              </AppText>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
