import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';
import { PeriodKey } from '@/utils/dateRanges';

const OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: '7d', label: '7 أيام' },
  { key: '30d', label: '30 يومًا' },
  { key: '90d', label: '90 يومًا' },
  { key: 'year', label: 'هذه السنة' },
];

export function PeriodFilter({ value, onChange }: { value: PeriodKey; onChange: (key: PeriodKey) => void }) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {OPTIONS.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: theme.radius.pill,
              backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
            }}
          >
            <AppText style={{ color: selected ? '#fff' : theme.colors.textPrimary }} weight="semibold" variant="caption">
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function TrendBadge({ change }: { change: number | null }) {
  const theme = useTheme();
  if (change === null) return null;
  const positive = change > 0;
  const flat = change === 0;
  const color = flat ? theme.colors.textTertiary : positive ? theme.colors.success : theme.colors.danger;
  const arrow = flat ? '' : positive ? '↑' : '↓';
  return (
    <View
      style={{
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: flat ? theme.colors.surfaceMuted : positive ? theme.colors.successMuted : theme.colors.dangerMuted,
      }}
    >
      <AppText variant="label" weight="semibold" style={{ color }}>
        {arrow} {Math.abs(change)}%
      </AppText>
    </View>
  );
}
