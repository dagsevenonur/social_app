import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  error?: boolean;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style,
      ]}
      placeholderTextColor={theme.colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    marginVertical: theme.spacing.xs,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
}); 