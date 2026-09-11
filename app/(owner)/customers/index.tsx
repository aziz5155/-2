import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Badge, Card, EmptyState, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { listCustomers } from '@/services/admin.service';

export default function CustomersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const customersQuery = useQuery({ queryKey: ['customers', search], queryFn: () => listCustomers(search) });

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">العملاء</AppText>

        <Input placeholder="ابحث باسم العائلة..." value={search} onChangeText={setSearch} />

        {customersQuery.isLoading ? (
          <LoadingState />
        ) : customersQuery.data?.length === 0 ? (
          <EmptyState emoji="👨‍👩‍👧" title="لا يوجد عملاء بعد" />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {customersQuery.data?.map((c) => (
              <Pressable key={c.family_id} onPress={() => router.push(`/(owner)/customers/${c.family_id}`)}>
                <Card style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="bodyBold">{c.family_name}</AppText>
                    <Badge label={c.plan_name ?? '—'} tone={c.plan_key === 'free' ? 'neutral' : 'primary'} />
                  </View>
                  <AppText variant="caption" color="secondary">
                    {c.owner_name} · {c.owner_email ?? 'بلا بريد'}
                  </AppText>
                  <AppText variant="caption" color="tertiary">
                    كود العائلة: {c.family_code}
                  </AppText>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
