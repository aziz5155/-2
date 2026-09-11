import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppIcon, TASK_ICON_OPTIONS } from '@/design-system/icons';
import { AppText, Avatar, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { listChildren } from '@/services/children.service';
import { getMyFamily } from '@/services/family.service';
import { addTaskToProgram, enrollChildInProgram } from '@/services/programs.service';
import { createTask } from '@/services/tasks.service';
import { ApprovalMode, RecurrenceType, TaskPriority } from '@/types/models';
import { todayDateOnly } from '@/utils/recurrence';

const RECURRENCE_OPTIONS: { value: RecurrenceType; labelKey: string }[] = [
  { value: 'once', labelKey: 'tasks.recurrenceOnce' },
  { value: 'daily', labelKey: 'tasks.recurrenceDaily' },
  { value: 'weekly', labelKey: 'tasks.recurrenceWeekly' },
  { value: 'custom_days', labelKey: 'tasks.recurrenceCustomDays' },
  { value: 'monthly', labelKey: 'tasks.recurrenceMonthly' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; labelKey: string }[] = [
  { value: 'low', labelKey: 'tasks.priorityLow' },
  { value: 'medium', labelKey: 'tasks.priorityMedium' },
  { value: 'high', labelKey: 'tasks.priorityHigh' },
];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
      }}
    >
      <AppText variant="caption" weight="semibold" style={{ color: selected ? theme.colors.onPrimary : theme.colors.textPrimary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function NewTaskScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { programId } = useLocalSearchParams<{ programId?: string }>();

  const familyQuery = useQuery({ queryKey: ['my-family'], queryFn: getMyFamily });
  const familyId = familyQuery.data?.id;
  const childrenQuery = useQuery({
    queryKey: ['children', familyId],
    queryFn: () => listChildren(familyId!),
    enabled: !!familyId,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('star');
  const [points, setPoints] = useState('10');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChild = (id: string) =>
    setSelectedChildren((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const toggleDay = (day: number) =>
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) return setError(t('common.requiredField'));
    if (selectedChildren.length === 0) return setError(t('tasks.assignTo'));
    if (!familyId) return;

    try {
      setLoading(true);
      const task = await createTask(
        {
          family_id: familyId,
          title: title.trim(),
          description: description.trim() || null,
          icon,
          category: null,
          points: Number(points) || 0,
          priority,
          recurrence_type: recurrence,
          recurrence_days: recurrence === 'custom_days' || recurrence === 'weekly' ? customDays : [],
          recurrence_day_of_month: null,
          start_date: todayDateOnly(),
          end_date: null,
          time_of_day: null,
          approval_mode: approvalMode,
        },
        selectedChildren,
      );

      if (programId) {
        await addTaskToProgram(programId, task.id, 0);
        await Promise.all(selectedChildren.map((childId) => enrollChildInProgram(programId, childId)));
      }

      await queryClient.invalidateQueries({ queryKey: ['family-today-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['program', programId] });
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
        <AppText variant="display">{t('tasks.newTask')}</AppText>

        <Input label={t('tasks.taskName')} value={title} onChangeText={setTitle} />
        <Input label={t('tasks.taskDescription')} value={description} onChangeText={setDescription} multiline />

        <AppText variant="label" color="secondary">
          {t('tasks.taskIcon')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {TASK_ICON_OPTIONS.slice(0, 16).map((key) => (
            <Pressable
              key={key}
              onPress={() => setIcon(key)}
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: icon === key ? theme.colors.primaryMuted : theme.colors.surfaceMuted,
              }}
            >
              <AppIcon name={key} color={icon === key ? theme.colors.primary : theme.colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Input label={t('tasks.taskPoints')} value={points} onChangeText={setPoints} keyboardType="number-pad" />

        <AppText variant="label" color="secondary">
          {t('tasks.assignTo')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {childrenQuery.data?.map((child) => {
            const selected = selectedChildren.includes(child.id);
            return (
              <Pressable
                key={child.id}
                onPress={() => toggleChild(child.id)}
                style={{ alignItems: 'center', gap: 4, opacity: selected ? 1 : 0.5 }}
              >
                <View style={{ borderWidth: selected ? 2 : 0, borderColor: theme.colors.primary, borderRadius: 30 }}>
                  <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={52} />
                </View>
                <AppText variant="caption">{child.name}</AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="label" color="secondary">
          {t('tasks.recurrence')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={t(opt.labelKey)} selected={recurrence === opt.value} onPress={() => setRecurrence(opt.value)} />
          ))}
        </View>

        {(recurrence === 'custom_days' || recurrence === 'weekly') && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {DAY_KEYS.map((key, index) => (
              <Chip key={key} label={t(`tasks.days.${key}`)} selected={customDays.includes(index)} onPress={() => toggleDay(index)} />
            ))}
          </View>
        )}

        <AppText variant="label" color="secondary">
          {t('tasks.priority')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          {PRIORITY_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={t(opt.labelKey)} selected={priority === opt.value} onPress={() => setPriority(opt.value)} />
          ))}
        </View>

        <AppText variant="label" color="secondary">
          {t('tasks.approvalMode')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <Chip label={t('tasks.approvalManual')} selected={approvalMode === 'manual'} onPress={() => setApprovalMode('manual')} />
          <Chip label={t('tasks.approvalAuto')} selected={approvalMode === 'auto'} onPress={() => setApprovalMode('auto')} />
        </View>

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
