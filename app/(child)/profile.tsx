import { Pressable, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, AppText, Badge, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { signOut } from '@/services/auth.service';
import { getMyChildProfile } from '@/services/children.service';
import { getStreak } from '@/services/streaks.service';
import { syncNativeDirection, useLocaleStore } from '@/stores/locale.store';
import { ThemePreference, useThemeStore } from '@/stores/theme.store';

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <AppText>{label}</AppText>
      {value ? <AppText color="secondary">{value}</AppText> : null}
    </Pressable>
  );
}

export default function ChildProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const childQuery = useQuery({ queryKey: ['my-child-profile'], queryFn: getMyChildProfile });
  const streakQuery = useQuery({
    queryKey: ['streak', childQuery.data?.id],
    queryFn: () => getStreak(childQuery.data!.id),
    enabled: !!childQuery.data,
  });

  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const cycleTheme = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    setThemePreference(order[(order.indexOf(themePreference) + 1) % order.length]);
  };

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
    syncNativeDirection(next);
  };

  if (childQuery.isLoading || !childQuery.data) return <LoadingState />;
  const child = childQuery.data;
  const level = getLevelInfo(child.lifetime_points);

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={84} />
          <AppText variant="title">{child.name}</AppText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Badge label={`${t('children.level')} ${level.level} · ${t(level.nameKey)}`} tone="primary" />
            {streakQuery.data && streakQuery.data.longest_streak > 0 && (
              <Badge label={`🔥 ${streakQuery.data.longest_streak}`} tone="streak" />
            )}
          </View>
        </View>

        <Card>
          <Row label={t('settings.appearance')} value={t(`settings.${themePreference}`)} onPress={cycleTheme} />
          <Row label={t('settings.language')} value={locale === 'ar' ? t('settings.arabic') : t('settings.english')} onPress={toggleLocale} />
        </Card>

        <Card>
          <Pressable
            onPress={() =>
              Alert.alert(t('settings.logoutConfirm'), '', [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.logout'),
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                    queryClient.clear();
                    router.replace('/');
                  },
                },
              ])
            }
          >
            <AppText color="danger" weight="semibold" align="center">
              {t('settings.logout')}
            </AppText>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}
