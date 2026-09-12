import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { signInWithApple, signInWithGoogleIdToken } from '@/services/auth.service';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  // Google.useAuthRequest throws synchronously (crashing the whole screen,
  // since it's a hook and can't be called conditionally) if webClientId is
  // `undefined` rather than an empty string — which is exactly what happens
  // when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID was never set in the deployment
  // environment. Falling back to '' keeps the hook safe to call; the button
  // below already checks googleWebClientId before actually using it.
  const [, , googlePromptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId ?? '',
    iosClientId: googleIosClientId ?? '',
  });

  const handleApple = async () => {
    try {
      setLoading('apple');
      await signInWithApple();
    } catch (e) {
      if (e instanceof Error && e.message.includes('ERR_REQUEST_CANCELED')) return;
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    if (!googleWebClientId) {
      Alert.alert('Google Sign-In', 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env to enable this.');
      return;
    }
    try {
      const result = await googlePromptAsync();
      if (result.type === 'success' && result.authentication?.idToken) {
        setLoading('google');
        await signInWithGoogleIdToken(result.authentication.idToken);
      }
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
        <View style={{ alignItems: 'center', marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
          <AppText style={{ fontSize: 64 }}>🏡</AppText>
          <AppText variant="hero" align="center">
            {t('auth.welcomeTitle')}
          </AppText>
          <AppText variant="body" color="secondary" align="center" style={{ maxWidth: 300 }}>
            {t('auth.welcomeSubtitle')}
          </AppText>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          {appleAvailable && (
            <Button
              label={t('auth.continueWithApple')}
              variant="primary"
              fullWidth
              size="lg"
              loading={loading === 'apple'}
              onPress={handleApple}
            />
          )}
          <Button
            label={t('auth.continueWithGoogle')}
            variant="outline"
            fullWidth
            size="lg"
            loading={loading === 'google'}
            onPress={handleGoogle}
          />
          <Button
            label={t('auth.continueWithEmail')}
            variant="secondary"
            fullWidth
            size="lg"
            onPress={() => router.push('/(auth)/parent-login')}
          />
          <View style={{ alignItems: 'center', marginTop: theme.spacing.sm }}>
            <AppText color="brand" weight="semibold" onPress={() => router.push('/(auth)/child-login')}>
              {t('auth.iAmChild')}
            </AppText>
          </View>
        </View>
      </View>
    </Screen>
  );
}
