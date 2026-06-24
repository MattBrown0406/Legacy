import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppointmentInput, KIND_LABELS, REMINDER_OPTIONS } from '@/data/appointments';
import { DateTimeField } from '@/components/DateTimeField';
import { Body, Button, Field, Label } from '@/components/ui';
import { Appointment, AppointmentKind, Case } from '@/types';
import { palette, radius, spacing } from '@/theme';

const KINDS: AppointmentKind[] = ['session', 'call', 'intervention', 'other'];

interface Props {
  cases: Case[];
  initial?: Appointment;
  initialCaseId?: string | null;
  submitLabel: string;
  onSubmit: (input: AppointmentInput) => Promise<void>;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Body style={[styles.chipText, active && styles.chipTextActive]}>{label}</Body>
    </Pressable>
  );
}

export function AppointmentForm({
  cases,
  initial,
  initialCaseId = null,
  submitLabel,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [kind, setKind] = useState<AppointmentKind>(initial?.kind ?? 'session');
  const [start, setStart] = useState<Date>(
    initial ? new Date(initial.starts_at) : roundedHourFromNow(),
  );
  const [end, setEnd] = useState<Date>(
    initial?.ends_at
      ? new Date(initial.ends_at)
      : new Date((initial ? new Date(initial.starts_at) : roundedHourFromNow()).getTime() + 3_600_000),
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [caseId, setCaseId] = useState<string | null>(initial?.case_id ?? initialCaseId);
  const [reminder, setReminder] = useState<number | null>(
    initial ? initial.reminder_minutes : 60,
  );
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this appointment a title.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      Alert.alert('Check times', 'The end time must be after the start time.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        kind,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location: location.trim() || null,
        case_id: caseId,
        reminder_minutes: reminder,
      });
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Field
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Henderson intervention"
        autoCapitalize="sentences"
      />

      <View style={styles.group}>
        <Label>Type</Label>
        <View style={styles.chipRow}>
          {KINDS.map((k) => (
            <Chip key={k} label={KIND_LABELS[k]} active={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      </View>

      <DateTimeField label="Starts" value={start} onChange={setStart} />
      <DateTimeField label="Ends" value={end} onChange={setEnd} />

      <Field
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Portland, OR / Zoom"
        autoCapitalize="words"
      />

      <View style={styles.group}>
        <Label>Reminder</Label>
        <View style={styles.chipRow}>
          {REMINDER_OPTIONS.map((opt) => (
            <Chip
              key={opt.label}
              label={opt.label}
              active={reminder === opt.value}
              onPress={() => setReminder(opt.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Label>Link to case (optional)</Label>
        <View style={styles.chipRow}>
          <Chip label="None" active={caseId === null} onPress={() => setCaseId(null)} />
          {cases.map((c) => (
            <Chip
              key={c.id}
              label={c.family_name}
              active={caseId === c.id}
              onPress={() => setCaseId(c.id)}
            />
          ))}
        </View>
      </View>

      <Button title={submitLabel} onPress={submit} loading={busy} style={styles.submit} />
    </View>
  );
}

function roundedHourFromNow(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  group: { marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  chipActive: { backgroundColor: palette.navy, borderColor: palette.navy },
  chipText: { fontSize: 14, color: palette.text },
  chipTextActive: { color: palette.white, fontWeight: '600' },
  submit: { marginTop: spacing.sm },
});
