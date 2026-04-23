import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export const Badge = memo(function Badge({ label, color = Colors.primary, size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '66' }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: FontSize.sm, fontWeight: '600' },
  textSm: { fontSize: FontSize.xs },
});
