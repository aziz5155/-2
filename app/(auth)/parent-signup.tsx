import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { signUpParent } from '@/services/auth.service';

export default function ParentSignupScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!fullName || !email || !password) {
      setError(t('common.requiredField'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    try {
      setLoading(true);
      const trimmedEmail = email.trim();
      const result = await signUpParent(trimmedEmail, password, fullName.trim());
      if (!result.session) {
        router.replace(`/(auth)/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl }}>
        <AppText variant="display">{t('auth.parentSignupTitle')}</AppText>

        <Input label={t('auth.fullName')} value={fullName} onChangeText={setFullName} />
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
          textContentType="newPassword"
        />
        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label={t('auth.signup')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: theme.spacing.sm }}>
          <AppText color="secondary">{t('auth.haveAccount')}</AppText>
          <AppText color="brand" weight="semibold" onPress={() => router.push('/(auth)/parent-login')}>
            {t('auth.login')}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
