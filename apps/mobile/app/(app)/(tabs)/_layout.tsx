import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, shadow } from '../../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  focused: boolean;
  outlineIcon: IoniconName;
  solidIcon: IoniconName;
  label: string;
}

/**
 * Custom tab icon: amber gold top-indicator pill when active,
 * outline → solid icon transition, label in caption size.
 */
function TabIcon({ focused, outlineIcon, solidIcon, label }: TabIconProps) {
  return (
    <View style={styles.iconWrapper}>
      {/* Active indicator — 2px amber pill at the top edge */}
      <View style={[styles.indicator, focused && styles.indicatorActive]} />

      <Ionicons
        name={focused ? solidIcon : outlineIcon}
        size={22}
        color={focused ? colors.primary : colors.textMuted}
        aria-hidden="true"
      />

      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, shadow.tabBar],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore hostels',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineIcon="search-outline"
              solidIcon="search"
              label="Explore"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarAccessibilityLabel: 'My bookings',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineIcon="calendar-outline"
              solidIcon="calendar"
              label="Bookings"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saved',
          tabBarAccessibilityLabel: 'Saved hostels',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineIcon="heart-outline"
              solidIcon="heart"
              label="Saved"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'My profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineIcon="person-outline"
              solidIcon="person"
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgTabBar,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    // Tall enough for the indicator + icon + label on both platforms
    height: Platform.OS === 'ios' ? 86 : 66,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 0,
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    width: 60,
    // paddingTop leaves room for the indicator above the icon
    paddingTop: 10,
  },

  // The amber pill sits above each icon.
  // position: 'absolute' + top: 0 places it at the very top of iconWrapper,
  // before the paddingTop, so it touches the tab bar's top edge.
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },

  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.primary,
  },
});
