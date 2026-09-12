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

export default function ChildLayout() {
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
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="home-outline" filled="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('nav.tasks'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="checkbox-outline" filled="checkbox" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t('nav.rewards'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="gift-outline" filled="gift" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('nav.achievements'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="trophy-outline" filled="trophy" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, focused }) => <TabIcon outline="person-outline" filled="person" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
