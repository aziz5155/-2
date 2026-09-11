import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { resendSignupCode, verifySignupCode } from '@/services/auth.service';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { t } = useTranslation();
  const theme = useTheme();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const mapError = (e: unknown) => {
    const message = e instanceof Error ? e.message.toLowerCase() : '';
    if (message.includes('expired')) return t('auth.codeExpired');
    return t('auth.codeInvalid');
  };

  const handleVerify = async () => {
    if (!email || code.length !== 6) return;
    setError(null);
    setInfo(null);
    try {
      setLoading(true);
      await verifySignupCode(email, code);
      // On success, onAuthStateChange picks up the new session and the
      // root gate (app/index.tsx) takes over automatically.
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError(null);
    try {
      setResending(true);
      await resendSignupCode(email);
      setInfo(t('auth.codeResent'));
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
        <AppText style={{ fontSize: 48 }}>📧</AppText>
        <AppText variant="display">{t('auth.verifyEmailTitle')}</AppText>
        <AppText color="secondary">{t('auth.verifyEmailSubtitle', { email })}</AppText>

        <Input
          label={t('auth.verificationCode')}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
        />

        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : info ? (
          <AppText color="success" variant="caption">
            {info}
          </AppText>
        ) : null}

        <Button
          label={t('auth.verifyButton')}
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          fullWidth
          size="lg"
        />

        <View style={{ alignItems: 'center', marginTop: theme.spacing.sm }}>
          {cooldown > 0 ? (
            <AppText color="tertiary" variant="caption">
              {t('auth.resendCodeIn', { seconds: cooldown })}
            </AppText>
          ) : (
            <AppText color="brand" weight="semibold" onPress={handleResend}>
              {resending ? '…' : t('auth.resendCode')}
            </AppText>
          )}
        </View>
      </View>
    </Screen>
  );
}
