import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/ThemeProvider';

export default function ParentLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard.whatNeedsYou'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: t('children.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: t('rewards.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('activity.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
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
