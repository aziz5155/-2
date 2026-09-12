import { Pressable, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Badge, Card, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyAdminRole } from '@/services/admin.service';
import { getMyFamily } from '@/services/family.service';
import { signOut } from '@/services/auth.service';
import { getSubscription, isPremium } from '@/services/subscriptions.service';
import { useLocaleStore, syncNativeDirection } from '@/stores/locale.store';
import { useThemeStore, ThemePreference } from '@/stores/theme.store';

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

export default function MoreScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', familyQuery.data?.id],
    queryFn: () => getSubscription(familyQuery.data!.id),
    enabled: !!familyQuery.data,
  });

  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const premium = isPremium(subscriptionQuery.data ?? null);
  const adminRoleQuery = useQuery({ queryKey: ['my-admin-role'], queryFn: getMyAdminRole });

  const cycleTheme = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(themePreference) + 1) % order.length];
    setThemePreference(next);
  };

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
    syncNativeDirection(next);
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('settings.title')}</AppText>

        {adminRoleQuery.data && (
          <Card backgroundColor={theme.colors.primary} elevation={0}>
            <Pressable onPress={() => router.push('/(owner)/dashboard')}>
              <AppText style={{ color: theme.colors.onPrimary }} variant="bodyBold">
                🛡️ لوحة المالك
              </AppText>
            </Pressable>
          </Card>
        )}

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="bodyBold">{t('settings.subscription')}</AppText>
            <Badge label={premium ? t('settings.premiumPlan') : t('settings.freePlan')} tone={premium ? 'primary' : 'neutral'} />
          </View>
          {!premium && (
            <Pressable onPress={() => Alert.alert(t('settings.upgrade'), 'App Store in-app purchases coming soon.')}>
              <AppText color="brand" weight="semibold" style={{ marginTop: 8 }}>
                {t('settings.upgrade')} →
              </AppText>
            </Pressable>
          )}
        </Card>

        <Card>
          <Row
            label={t('settings.familyCode')}
            value={familyQuery.data?.family_code}
            onPress={() => familyQuery.data && Alert.alert(t('settings.familyCode'), familyQuery.data.family_code)}
          />
          <Row
            label={t('settings.appearance')}
            value={t(`settings.${themePreference}`)}
            onPress={cycleTheme}
          />
          <Row label={t('settings.language')} value={locale === 'ar' ? t('settings.arabic') : t('settings.english')} onPress={toggleLocale} />
          <Row label={t('analytics.title')} onPress={() => router.push('/(parent)/analytics')} />
          <Row label={t('challenges.title')} onPress={() => router.push('/(parent)/challenges')} />
          <Row label={t('auth.changePassword')} onPress={() => router.push('/(parent)/change-password')} />
        </Card>

        <Card>
          <Pressable onPress={handleLogout}>
            <AppText color="danger" weight="semibold" align="center">
              {t('settings.logout')}
            </AppText>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}
