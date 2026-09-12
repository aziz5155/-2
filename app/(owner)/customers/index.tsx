import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Badge, Card, EmptyState, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listCustomerAccounts } from '@/services/admin.service';

export default function CustomersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const customersQuery = useQuery({ queryKey: ['customer-accounts', search], queryFn: () => listCustomerAccounts(search) });

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">العملاء</AppText>

        <Input placeholder="ابحث بالاسم أو البريد..." value={search} onChangeText={setSearch} />

        {customersQuery.isLoading ? (
          <LoadingState />
        ) : customersQuery.isError ? (
          <Card backgroundColor={theme.colors.dangerMuted} elevation={0}>
            <AppText color="danger" weight="semibold">
              تعذر تحميل العملاء
            </AppText>
            <AppText variant="caption" color="danger">
              {customersQuery.error instanceof Error ? customersQuery.error.message : String(customersQuery.error)}
            </AppText>
          </Card>
        ) : customersQuery.data?.length === 0 ? (
          <EmptyState icon="people" title="لا يوجد عملاء بعد" />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {customersQuery.data?.map((c) => {
              const content = (
                <Card style={{ gap: 4, opacity: c.family_id ? 1 : 0.75 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="bodyBold">{c.full_name}</AppText>
                    {c.family_id ? (
                      <Badge label={c.plan_name ?? '—'} tone={c.plan_key === 'free' ? 'neutral' : 'primary'} />
                    ) : (
                      <Badge label="لم ينشئ عائلة بعد" tone="neutral" />
                    )}
                  </View>
                  <AppText variant="caption" color="secondary">
                    {c.email ?? 'بلا بريد'}
                  </AppText>
                  {c.family_id && (
                    <AppText variant="caption" color="tertiary">
                      {c.family_name} · كود: {c.family_code}
                    </AppText>
                  )}
                </Card>
              );

              return c.family_id ? (
                <Pressable key={c.user_id} onPress={() => router.push(`/(owner)/customers/${c.family_id}`)}>
                  {content}
                </Pressable>
              ) : (
                <View key={c.user_id}>{content}</View>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}
