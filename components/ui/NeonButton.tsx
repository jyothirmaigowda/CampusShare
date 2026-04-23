import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const NeonButton = memo(function NeonButton({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, fullWidth = false,
}: NeonButtonProps) {
  const isDisabled = disabled || loading;

  const bgColor = {
    primary: Colors.primary,
    accent: Colors.accent,
    danger: Colors.danger,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: '#ffffff',
    accent: '#ffffff',
    danger: '#ffffff',
    outline: Colors.primary,
    ghost: Colors.textSecondary,
  }[variant];

  const borderColor = {
    primary: Colors.primary,
    accent: Colors.accent,
    danger: Colors.danger,
    outline: Colors.primary,
    ghost: 'transparent',
  }[variant];

  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.lg };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          height: heights[size],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize: fontSizes[size] }]}>{label}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
  },
  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
});
