import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { setNewPassword } from '@/services/auth.service';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 6) return setError(t('auth.passwordTooShort'));
    if (password !== confirmPassword) return setError(t('auth.passwordsDontMatch'));

    try {
      setLoading(true);
      await setNewPassword(password);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
        <AppText variant="display">{t('auth.changePassword')}</AppText>

        <Input label={t('auth.newPassword')} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
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
