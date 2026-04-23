import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { Colors } from '@/constants/theme';

function NotifBellIcon({ color, size, unread }: { color: string; size: number; unread: number }) {
  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="notifications" size={size} color={color} />
      {unread > 0 ? (
        <View style={badgeStyles.badge}>
          <Text style={badgeStyles.text}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.danger,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.tabBar,
  },
  text: { fontSize: 9, color: '#fff', fontWeight: '700' },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, isInitialized } = useAuth();
  const { unreadCount, setCurrentUserId, loadNotifications } = useAppData();

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadNotifications(user.id);
    }
  }, [user?.id]);

  if (!isInitialized) return null;
  if (!user) return <Redirect href="/" />;
  if (user.role === 'admin') return <Redirect href="/admin" />;

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: 4,
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="menu-book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color, size }) => <NotifBellIcon color={color} size={size} unread={unreadCount} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="smart-toy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
