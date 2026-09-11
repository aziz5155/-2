import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs } from 'expo-router';

import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyAdminRole } from '@/services/admin.service';

export default function OwnerLayout() {
  const theme = useTheme();

  // Defense in depth: RLS already blocks non-admins from every table these
  // screens read, but we still gate the route itself so a non-admin never
  // even sees empty admin screens.
  const adminRoleQuery = useQuery({ queryKey: ['my-admin-role'], queryFn: getMyAdminRole });

  if (adminRoleQuery.isLoading) return <LoadingState />;
  if (!adminRoleQuery.data) return <Redirect href="/(parent)/dashboard" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="customers/index"
        options={{ title: 'العملاء', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="plans/index"
        options={{ title: 'الباقات', tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="promo-codes/index"
        options={{ title: 'أكواد الخصم', tabBarIcon: ({ color, size }) => <Ionicons name="ticket" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'المزيد', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle" color={color} size={size} /> }}
      />

      <Tabs.Screen name="customers/[familyId]" options={{ href: null }} />
      <Tabs.Screen name="promo-codes/new" options={{ href: null }} />
      <Tabs.Screen name="audit-log" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
    </Tabs>
  );
}
