import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from './Avatar';
import { AppText } from './AppText';
import { Card } from './Card';
import { AppIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { getLevelInfo } from '@/constants/levels';
import { listChildTasksForDate } from '@/services/tasks.service';
import { getStreak } from '@/services/streaks.service';
import { useIsRTL } from '@/stores/locale.store';
import { todayDateOnly } from '@/utils/recurrence';
import { Child } from '@/types/models';

const DONE_STATUSES = new Set(['approved', 'auto_approved']);

function StatChip({ icon, label, color, tint }: { icon: string; label: string; color: string; tint: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: theme.radius.pill,
        backgroundColor: tint,
      }}
    >
      <AppIcon name={icon} size={13} color={color} />
      <AppText variant="label" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

export function ChildSummaryCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rtl = useIsRTL();
  const today = todayDateOnly();
  const level = getLevelInfo(child.lifetime_points);

  const streakQuery = useQuery({ queryKey: ['streak', child.id], queryFn: () => getStreak(child.id) });
  const todayTasksQuery = useQuery({
    queryKey: ['child-tasks-today', child.id, today],
    queryFn: () => listChildTasksForDate(child.id, today),
  });

  const tasksToday = todayTasksQuery.data ?? [];
  const doneToday = tasksToday.filter((t) => t.completion && DONE_STATUSES.has(t.completion.status)).length;
  const remainingToday = tasksToday.length - doneToday;
  const streak = streakQuery.data?.current_streak ?? 0;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card elevation={1} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, opacity: pressed ? 0.85 : 1 }}>
          <Avatar name={child.name} uri={child.avatar_url} emoji={child.avatar_emoji} size={52} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="bodyBold" numberOfLines={1} style={{ flexShrink: 1 }}>
                {child.name}
              </AppText>
              <AppText variant="label" color="tertiary">
                · {t(level.nameKey)}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <StatChip icon="star" label={String(child.points_balance)} color={theme.colors.points} tint={theme.colors.pointsMuted} />
              {streak > 0 && (
                <StatChip icon="flame" label={String(streak)} color={theme.colors.streak} tint={theme.colors.streakMuted} />
              )}
              {tasksToday.length > 0 && (
                <StatChip
                  icon="checkmark"
                  label={`${doneToday}/${tasksToday.length}`}
                  color={remainingToday === 0 ? theme.colors.success : theme.colors.textSecondary}
                  tint={remainingToday === 0 ? theme.colors.successMuted : theme.colors.surfaceMuted}
                />
              )}
            </View>
          </View>
          <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.colors.textTertiary} />
        </Card>
      )}
    </Pressable>
  );
}
