import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { sendPasswordResetEmail } from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t('common.requiredField'));
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen scroll>
        <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
          <AppText style={{ fontSize: 48 }}>✅</AppText>
          <AppText variant="display">{t('auth.resetLinkSent')}</AppText>
          <AppText color="secondary">{t('auth.resetLinkSentSubtitle', { email: email.trim() })}</AppText>
          <Button label={t('auth.backToLogin')} variant="secondary" onPress={() => router.replace('/(auth)/parent-login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
        <AppText variant="display">{t('auth.forgotPasswordTitle')}</AppText>
        <AppText color="secondary">{t('auth.forgotPasswordSubtitle')}</AppText>

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label={t('auth.sendResetLink')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />

        <AppText color="brand" weight="semibold" align="center" onPress={() => router.back()}>
          {t('auth.backToLogin')}
        </AppText>
      </View>
    </Screen>
  );
}
