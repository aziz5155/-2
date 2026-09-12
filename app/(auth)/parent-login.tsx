import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { signInParent } from '@/services/auth.service';

export default function ParentLoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError(t('common.requiredField'));
      return;
    }
    const trimmedEmail = email.trim();
    try {
      setLoading(true);
      await signInParent(trimmedEmail, password);
      router.replace('/');
    } catch (e) {
      const message = e instanceof Error ? e.message.toLowerCase() : '';
      if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
        router.replace(`/(auth)/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        return;
      }
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl }}>
        <AppText variant="display">{t('auth.parentLoginTitle')}</AppText>

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />
        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label={t('auth.login')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />

        <AppText color="brand" weight="semibold" align="center" onPress={() => router.push('/(auth)/forgot-password')}>
          {t('auth.forgotPassword')}
        </AppText>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: theme.spacing.sm }}>
          <AppText color="secondary">{t('auth.noAccount')}</AppText>
          <AppText color="brand" weight="semibold" onPress={() => router.push('/(auth)/parent-signup')}>
            {t('auth.createAccount')}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
