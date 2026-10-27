import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={22} color={typeof color === 'string' ? color : undefined} />;
  };
}

const TAB_BAR_CONTENT_HEIGHT = 62;

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        // The bar adds the bottom safe-area inset as padding itself; the height must include it.
        // Item content (padding + icon + label) needs about 52px, more than the 49px platform default.
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bills', tabBarIcon: icon('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="upcoming" options={{ title: 'Upcoming', tabBarIcon: icon('calendar', 'calendar-outline') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('pie-chart', 'pie-chart-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
