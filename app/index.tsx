import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';

import { LoadingState } from '@/design-system/components/LoadingState';
import { getMyAdminRole } from '@/services/admin.service';
import { getMyFamily } from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const appUser = useAuthStore((s) => s.appUser);

  const isParent = appUser?.kind === 'parent';

  const adminRoleQuery = useQuery({
    queryKey: ['my-admin-role'],
    queryFn: getMyAdminRole,
    enabled: !!session && isParent,
  });

  const familyQuery = useQuery({
    queryKey: ['my-family'],
    queryFn: getMyFamily,
    enabled: !!session && isParent && adminRoleQuery.data === null,
  });

  if (!session || !appUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isParent) {
    return <Redirect href="/(child)/home" />;
  }

  if (adminRoleQuery.isLoading) {
    return <LoadingState />;
  }

  // Owners/staff land straight in the owner dashboard — they don't need a family.
  if (adminRoleQuery.data) {
    return <Redirect href="/(owner)/dashboard" />;
  }

  if (familyQuery.isLoading) {
    return <LoadingState />;
  }

  if (!familyQuery.data) {
    return <Redirect href="/(auth)/create-family" />;
  }

  return <Redirect href="/(parent)/dashboard" />;
}
