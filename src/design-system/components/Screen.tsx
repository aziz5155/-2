import React from 'react';
import { RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing,
  edges = ['top'],
}: ScreenProps) {
  const theme = useTheme();

  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
      edges={edges}
    >
      <Container
        style={scroll ? undefined : { flex: 1, padding: padded ? theme.spacing.md : 0 }}
        contentContainerStyle={
          scroll
            ? [{ padding: padded ? theme.spacing.md : 0, flexGrow: 1 }, contentContainerStyle]
            : undefined
        }
        refreshControl={
          scroll && onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          ) : undefined
        }
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
