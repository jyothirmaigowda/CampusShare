import React, { memo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface NeonInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
}

export const NeonInput = memo(function NeonInput({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'sentences', multiline = false, numberOfLines = 1, error,
}: NeonInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        error ? styles.inputError : null,
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.multilineInput]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
            <MaterialIcons name={showPass ? 'visibility' : 'visibility-off'} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputFocused: { borderColor: Colors.inputFocusBorder },
  inputError: { borderColor: Colors.danger },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    paddingVertical: 14,
    includeFontPadding: false,
  },
  multilineInput: { minHeight: 90, paddingTop: 14 },
  eyeIcon: { padding: 4 },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },
});
