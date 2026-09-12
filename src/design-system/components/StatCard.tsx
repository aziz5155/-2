import { View } from 'react-native';

import { AppText } from './AppText';
import { Card } from './Card';
import { TrendBadge } from './PeriodFilter';
import { AppIcon } from '../icons';
import { useTheme } from '../ThemeProvider';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: number | null;
  tint?: string;
}

export function StatCard({ icon, label, value, change, tint }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card elevation={1} style={{ flex: 1, minWidth: 150, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.md,
            backgroundColor: tint ?? theme.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={16} color={theme.colors.primary} />
        </View>
        {change !== undefined && <TrendBadge change={change} />}
      </View>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
    </Card>
  );
}
