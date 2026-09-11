import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';

import { LoadingState } from '@/design-system/components/LoadingState';
import { getMyFamily } from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const appUser = useAuthStore((s) => s.appUser);

  const isParent = appUser?.kind === 'parent';

  const familyQuery = useQuery({
    queryKey: ['my-family'],
    queryFn: getMyFamily,
    enabled: !!session && isParent,
  });

  if (!session || !appUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isParent) {
    return <Redirect href="/(child)/home" />;
  }

  if (familyQuery.isLoading) {
    return <LoadingState />;
  }

  if (!familyQuery.data) {
    return <Redirect href="/(auth)/create-family" />;
  }

  return <Redirect href="/(parent)/dashboard" />;
}
