import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Icon + label row, matching the previous inner height (excludes the system inset). */
const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'ios' ? 64 : 56;

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  size: number;
};

function TabIcon({ name, color, size }: TabIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop: spacing.xs,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          fontSize: 11,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'მთავარი',
          tabBarAccessibilityLabel: 'მთავარი',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'შეკვეთები',
          tabBarAccessibilityLabel: 'შეკვეთები',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'ჩემი მანქანები',
          tabBarAccessibilityLabel: 'ჩემი მანქანები',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="car-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'პროფილი',
          tabBarAccessibilityLabel: 'პროფილი',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
