import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { createChild } from '@/services/auth.service';
import { getMyFamily } from '@/services/family.service';

const AVATAR_EMOJIS = ['🦁', '🐼', '🦊', '🐸', '🐧', '🦄', '🐯', '🐨', '🐵', '🐰'];

export default function NewChildScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError(t('common.requiredField'));
    if (!/^\d{4}$/.test(pin)) return setError(t('auth.pinHint'));
    if (pin !== confirmPin) return setError('PINs do not match');
    if (!familyQuery.data) return;

    try {
      setLoading(true);
      const birthYear = age ? new Date().getFullYear() - Number(age) : undefined;
      await createChild({
        family_id: familyQuery.data.id,
        name: name.trim(),
        pin,
        avatar_emoji: emoji,
        birth_year: birthYear,
      });
      await queryClient.invalidateQueries({ queryKey: ['children'] });
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
        <AppText variant="display">{t('children.addChild')}</AppText>

        <AppText variant="label" color="secondary">
          {t('children.avatar')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {AVATAR_EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: emoji === e ? theme.colors.primaryMuted : theme.colors.surfaceMuted,
                borderWidth: emoji === e ? 2 : 0,
                borderColor: theme.colors.primary,
              }}
            >
              <AppText style={{ fontSize: 22 }}>{e}</AppText>
            </Pressable>
          ))}
        </View>

        <Input label={t('children.childName')} value={name} onChangeText={setName} />
        <Input label={t('children.childAge')} value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Input
          label={t('children.setPin')}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
        />
        <Input
          label={t('common.confirm')}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
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
