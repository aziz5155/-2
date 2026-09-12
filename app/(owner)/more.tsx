import { Pressable, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Card, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyAdminRole } from '@/services/admin.service';
import { signOut } from '@/services/auth.service';

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle }}
    >
      <AppText>{label}</AppText>
    </Pressable>
  );
}

export default function OwnerMoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const adminRoleQuery = useQuery({ queryKey: ['my-admin-role'], queryFn: getMyAdminRole });
  const isOwner = adminRoleQuery.data === 'owner';

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">المزيد</AppText>

        <Card>
          <Row label="سجل التدقيق الإداري" onPress={() => router.push('/(owner)/audit-log')} />
          {isOwner && <Row label="فريق الإدارة" onPress={() => router.push('/(owner)/staff')} />}
          <Row label="تغيير كلمة المرور" onPress={() => router.push('/(parent)/change-password')} />
        </Card>

        <Card>
          <Pressable
            onPress={() =>
              Alert.alert('تسجيل الخروج', '', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: () => signOut() },
              ])
            }
          >
            <AppText color="danger" weight="semibold" align="center">
              تسجيل الخروج
            </AppText>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}
