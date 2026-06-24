import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Label } from '@/components/ui';
import { palette, radius, spacing } from '@/theme';

export interface DateTimeFieldProps {
  label?: string;
  value: Date;
  onChange: (next: Date) => void;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Label>{label}</Label> : null}
      <View style={styles.row}>
        <Pressable style={styles.box} onPress={() => setShowDate(true)}>
          <Body>{fmtDate(value)}</Body>
        </Pressable>
        <Pressable style={[styles.box, styles.timeBox]} onPress={() => setShowTime(true)}>
          <Body>{fmtTime(value)}</Body>
        </Pressable>
      </View>

      {showDate ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={(_e, selected) => {
            setShowDate(false);
            if (selected) {
              const next = new Date(value);
              next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
              onChange(next);
            }
          }}
        />
      ) : null}

      {showTime ? (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          onChange={(_e, selected) => {
            setShowTime(false);
            if (selected) {
              const next = new Date(value);
              next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
              onChange(next);
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  box: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  timeBox: { flex: 0.7 },
});
