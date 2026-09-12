import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Avatar, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { createChild } from '@/services/auth.service';
import { uploadChildAvatar } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';

export default function NewChildScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarMime, setAvatarMime] = useState('image/jpeg');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarMime(result.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError(t('common.requiredField'));
    if (!/^\d{4}$/.test(pin)) return setError(t('auth.pinHint'));
    if (pin !== confirmPin) return setError('PINs do not match');
    if (!familyQuery.data) return;

    try {
      setLoading(true);
      const birthYear = age ? new Date().getFullYear() - Number(age) : undefined;
      const avatarUrl = avatarUri ? await uploadChildAvatar(familyQuery.data.id, avatarUri, avatarMime) : undefined;
      await createChild({
        family_id: familyQuery.data.id,
        name: name.trim(),
        pin,
        avatar_url: avatarUrl,
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

        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <Pressable onPress={pickImage}>
            <Avatar name={name || '?'} uri={avatarUri} size={88} />
          </Pressable>
          <Pressable onPress={pickImage}>
            <AppText color="primary" weight="semibold">
              {avatarUri ? t('common.edit') : t('children.avatar')}
            </AppText>
          </Pressable>
          {avatarUri ? (
            <Pressable onPress={() => setAvatarUri(null)}>
              <AppText variant="caption" color="danger">
                {t('common.delete')}
              </AppText>
            </Pressable>
          ) : (
            <AppText variant="caption" color="tertiary">
              {t('common.optional')}
            </AppText>
          )}
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
