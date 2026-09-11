import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { exchangeRecoveryCode, setNewPassword } from '@/services/auth.service';

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [exchanging, setExchanging] = useState(!!code);
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    exchangeRecoveryCode(code)
      .then(() => setLinkValid(true))
      .catch(() => setLinkValid(false))
      .finally(() => setExchanging(false));
  }, [code]);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }
    try {
      setLoading(true);
      await setNewPassword(password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (exchanging) return <LoadingState />;

  if (!linkValid) {
    return (
      <Screen scroll>
        <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
          <AppText style={{ fontSize: 48 }}>⚠️</AppText>
          <AppText variant="display">{t('auth.resetLinkInvalid')}</AppText>
          <Button label={t('auth.forgotPasswordTitle')} onPress={() => router.replace('/(auth)/forgot-password')} />
        </View>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen scroll>
        <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
          <AppText style={{ fontSize: 48 }}>✅</AppText>
          <AppText variant="display">{t('auth.passwordUpdated')}</AppText>
          <Button label={t('common.done')} onPress={() => router.replace('/')} fullWidth size="lg" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
        <AppText variant="display">{t('auth.resetPasswordTitle')}</AppText>

        <Input
          label={t('auth.newPassword')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />
        <Input
          label={t('auth.confirmNewPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label={t('common.save')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />
      </View>
    </Screen>
  );
}
