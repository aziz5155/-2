import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/design-system/ThemeProvider';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ outline, filled, color, focused }: { outline: IoniconName; filled: IoniconName; color: ColorValue; focused: boolean }) {
  return <Ionicons name={focused ? filled : outline} color={color} size={23} />;
}

export default function ParentLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="home-outline" filled="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: t('nav.children'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="people-outline" filled="people" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: t('nav.rewards'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="gift-outline" filled="gift" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('nav.activity'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="pulse-outline" filled="pulse" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="settings-outline" filled="settings" color={color} focused={focused} />,
        }}
      />

      {/* Pushed (non-tab) screens */}
      <Tabs.Screen name="children/[childId]" options={{ href: null }} />
      <Tabs.Screen name="children/new" options={{ href: null }} />
      <Tabs.Screen name="tasks/new" options={{ href: null }} />
      <Tabs.Screen name="rewards/new" options={{ href: null }} />
      <Tabs.Screen name="programs/index" options={{ href: null }} />
      <Tabs.Screen name="programs/templates" options={{ href: null }} />
      <Tabs.Screen name="programs/[programId]" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
      <Tabs.Screen name="challenges/index" options={{ href: null }} />
      <Tabs.Screen name="challenges/new" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="quick-points" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
    </Tabs>
  );
}
