import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '@/design-system/icons';
import { AppText, Badge, Card, Screen } from '@/design-system/components';
import { LoadingState } from '@/design-system/components/LoadingState';
import { useTheme } from '@/design-system/ThemeProvider';
import { getMyFamily } from '@/services/family.service';
import { createProgramFromTemplate, listProgramTemplates } from '@/services/programs.service';
import { getSubscription, isPremium } from '@/services/subscriptions.service';

export default function ProgramTemplatesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;

  const templatesQuery = useQuery({ queryKey: ['program-templates'], queryFn: listProgramTemplates });
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', familyId],
    queryFn: () => getSubscription(familyId!),
    enabled: !!familyId,
  });

  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const premium = isPremium(subscriptionQuery.data ?? null);

  const handleSelect = async (templateId: string, key: string, requiresPremium: boolean) => {
    if (requiresPremium && !premium) {
      Alert.alert(t('settings.premiumPlan'), t('settings.upgrade'));
      return;
    }
    if (!familyId) return;
    try {
      setCreatingKey(key);
      const program = await createProgramFromTemplate(familyId, templateId);
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      router.replace(`/(parent)/programs/${program.id}`);
    } catch (e) {
      Alert.alert(t('common.somethingWentWrong'), e instanceof Error ? e.message : undefined);
    } finally {
      setCreatingKey(null);
    }
  };

  if (templatesQuery.isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="display">{t('programs.templates')}</AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {templatesQuery.data?.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => handleSelect(template.id, template.key, template.is_premium)}
              style={{ width: '47%' }}
            >
              <Card style={{ gap: 8, alignItems: 'flex-start', opacity: creatingKey && creatingKey !== template.key ? 0.5 : 1 }}>
                <AppIcon name={template.icon} size={28} color={theme.colors.primary} />
                <AppText variant="bodyBold">{template.name}</AppText>
                {template.description && (
                  <AppText variant="caption" color="secondary" numberOfLines={2}>
                    {template.description}
                  </AppText>
                )}
                {template.is_premium && <Badge label="Premium" tone="warning" />}
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
