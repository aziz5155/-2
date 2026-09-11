import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText, Badge, Button, Card, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { addAdminByEmail, listAdminUsers, setAdminActive } from '@/services/admin.service';
import { AdminRole } from '@/types/admin';

const ROLE_OPTIONS: { value: Exclude<AdminRole, 'owner'>; label: string }[] = [
  { value: 'admin', label: 'مدير' },
  { value: 'support', label: 'دعم' },
  { value: 'marketing', label: 'تسويق' },
  { value: 'finance', label: 'محاسبة' },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'المالك',
  admin: 'مدير',
  support: 'دعم',
  marketing: 'تسويق',
  finance: 'محاسبة',
};

export default function StaffScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: listAdminUsers });

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<AdminRole, 'owner'>>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (!email.trim()) return setError('أدخل البريد الإلكتروني');
    try {
      setLoading(true);
      await addAdminByEmail(email.trim(), role);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    Alert.alert(isActive ? 'تعطيل الحساب' : 'تفعيل الحساب', '', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: isActive ? 'تعطيل' : 'تفعيل',
        onPress: async () => {
          try {
            await setAdminActive(userId, !isActive);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
          } catch (e) {
            Alert.alert('خطأ', e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  };

  if (staffQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">فريق الإدارة</AppText>

        <Card style={{ gap: theme.spacing.sm }}>
          <AppText variant="bodyBold">إضافة موظف</AppText>
          <AppText variant="caption" color="secondary">
            يجب أن يكون قد أنشأ حسابًا في التطبيق بالفعل (تسجيل ولي أمر عادي) بنفس البريد.
          </AppText>
          <Input label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {ROLE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setRole(opt.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.pill,
                  backgroundColor: role === opt.value ? theme.colors.primary : theme.colors.surfaceMuted,
                }}
              >
                <AppText variant="caption" style={{ color: role === opt.value ? theme.colors.onPrimary : theme.colors.textPrimary }}>
                  {opt.label}
                </AppText>
              </Pressable>
            ))}
          </View>
          {error ? (
            <AppText color="danger" variant="caption">
              {error}
            </AppText>
          ) : null}
          <Button label="إضافة" onPress={handleAdd} loading={loading} />
        </Card>

        <View style={{ gap: theme.spacing.sm }}>
          {staffQuery.data?.map((member) => (
            <Card key={member.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{member.user.full_name || member.user.email}</AppText>
                <AppText variant="caption" color="secondary">
                  {member.user.email}
                </AppText>
              </View>
              <Badge label={ROLE_LABELS[member.role]} tone={member.role === 'owner' ? 'primary' : 'neutral'} />
              {member.role !== 'owner' && (
                <Pressable onPress={() => handleToggleActive(member.user_id, member.is_active)}>
                  <AppText color={member.is_active ? 'danger' : 'success'} variant="caption" weight="semibold">
                    {member.is_active ? 'تعطيل' : 'تفعيل'}
                  </AppText>
                </Pressable>
              )}
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
