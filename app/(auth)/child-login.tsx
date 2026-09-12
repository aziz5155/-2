import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { childSignIn, listFamilyChildrenByCode } from '@/services/auth.service';
import { Child } from '@/types/models';

type Step = 'code' | 'child';

export default function ChildLoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [familyCode, setFamilyCode] = useState('');
  const [children, setChildren] = useState<Pick<Child, 'id' | 'name' | 'avatar_emoji' | 'avatar_url'>[]>([]);
  const [signingInId, setSigningInId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    setError(null);
    if (!familyCode.trim()) {
      setError(t('common.requiredField'));
      return;
    }
    try {
      setLoading(true);
      const res = await listFamilyChildrenByCode(familyCode.trim().toUpperCase());
      setChildren(res.children);
      setStep('child');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (childId: string) => {
    try {
      setSigningInId(childId);
      setError(null);
      await childSignIn(familyCode.trim().toUpperCase(), childId);
      router.replace('/');
    } catch {
      setError(t('auth.invalidCredentials'));
      setSigningInId(null);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.xxl, flex: 1 }}>
        <AppText variant="display">{t('auth.childLoginTitle')}</AppText>

        {step === 'code' && (
          <>
            <Input
              label={t('auth.familyCode')}
              value={familyCode}
              onChangeText={(v) => setFamilyCode(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              placeholder="ABC123"
            />
            {error ? <AppText color="danger" variant="caption">{error}</AppText> : null}
            <Button label={t('common.next')} onPress={handleLookup} loading={loading} fullWidth size="lg" />
          </>
        )}

        {step === 'child' && (
          <>
            <AppText variant="subtitle">{t('auth.selectYourName')}</AppText>
            {error ? <AppText color="danger" variant="caption">{error}</AppText> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {children.map((c) => (
                <Pressable
                  key={c.id}
                  disabled={signingInId !== null}
                  onPress={() => handleSignIn(c.id)}
                  style={{
                    alignItems: 'center',
                    gap: 6,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.lg,
                    backgroundColor: theme.colors.surfaceMuted,
                    width: 92,
                    opacity: signingInId && signingInId !== c.id ? 0.4 : 1,
                  }}
                >
                  <Avatar name={c.name} uri={c.avatar_url} emoji={c.avatar_emoji} size={56} />
                  <AppText variant="caption" align="center" numberOfLines={1}>
                    {signingInId === c.id ? t('common.loading') : c.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
