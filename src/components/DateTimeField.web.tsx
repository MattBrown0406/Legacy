import React from 'react';
import { View } from 'react-native';
import { Label } from '@/components/ui';
import { palette, spacing } from '@/theme';
import type { DateTimeFieldProps } from './DateTimeField';

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Label>{label}</Label> : null}
      {/* On web (react-native-web) we render a native DOM input. */}
      <input
        type="datetime-local"
        value={toLocalInputValue(value)}
        onChange={(e) => {
          const v = (e.target as HTMLInputElement).value;
          if (v) onChange(new Date(v));
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: palette.white,
          border: `1px solid ${palette.line}`,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: palette.text,
          fontFamily: 'inherit',
        }}
      />
    </View>
  );
}
