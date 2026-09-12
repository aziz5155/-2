import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { createFamily, signOut } from '@/services/auth.service';

export default function CreateFamilyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('common.requiredField'));
      return;
    }
    try {
      setLoading(true);
      await createFamily(name.trim());
      router.replace('/(parent)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
        <AppText style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</AppText>
        <AppText variant="display">{t('onboarding.createFamilyTitle')}</AppText>
        <AppText color="secondary">{t('onboarding.createFamilySubtitle')}</AppText>

        <Input
          label={t('onboarding.familyName')}
          placeholder={t('onboarding.familyNamePlaceholder')}
          value={name}
          onChangeText={setName}
        />
        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label={t('onboarding.createFamily')} onPress={handleSubmit} loading={loading} fullWidth size="lg" />

        <View style={{ flex: 1 }} />
        <Button
          label={t('settings.logout')}
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
