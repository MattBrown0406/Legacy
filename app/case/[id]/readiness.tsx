import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  addCaseNote,
  addParticipant,
  deleteCaseNote,
  deleteParticipant,
  listCaseNotes,
  listParticipants,
  listReadinessSteps,
  setReadinessStatus,
  updateParticipant,
} from '@/data/readiness';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  H2,
  Label,
  Muted,
} from '@/components/ui';
import {
  CaseNote,
  Participant,
  ReadinessStatus,
  ReadinessStep,
  READINESS_WORKFLOW,
} from '@/types';
import { palette, radius, spacing } from '@/theme';

const STATUS_CYCLE: Record<ReadinessStatus, ReadinessStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

function stepIcon(status: ReadinessStatus): { name: keyof typeof Ionicons.glyphMap; color: string } {
  switch (status) {
    case 'done':
      return { name: 'checkmark-circle', color: palette.success };
    case 'in_progress':
      return { name: 'ellipse-outline', color: palette.gold };
    default:
      return { name: 'ellipse-outline', color: palette.textMuted };
  }
}

export default function ReadinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<Record<string, ReadinessStatus>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [stepRows, pRows, nRows] = await Promise.all([
        listReadinessSteps(id),
        listParticipants(id),
        listCaseNotes(id),
      ]);
      const map: Record<string, ReadinessStatus> = {};
      stepRows.forEach((s: ReadinessStep) => (map[s.step_key] = s.status));
      setSteps(map);
      setParticipants(pRows);
      setNotes(nRows);
    } catch (e) {
      console.warn('[Legacy] readiness load failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function cycleStep(stepKey: string) {
    if (!id) return;
    const current = steps[stepKey] ?? 'todo';
    const next = STATUS_CYCLE[current];
    setSteps((s) => ({ ...s, [stepKey]: next }));
    try {
      await setReadinessStatus(id, stepKey, next);
    } catch (e: any) {
      Alert.alert('Could not update step', e?.message ?? 'Unknown error');
      load();
    }
  }

  async function onAddParticipant() {
    if (!id || !newName.trim()) return;
    try {
      const p = await addParticipant(id, { name: newName.trim(), role: newRole.trim() || null });
      setParticipants((list) => [...list, p]);
      setNewName('');
      setNewRole('');
    } catch (e: any) {
      Alert.alert('Could not add participant', e?.message ?? 'Unknown error');
    }
  }

  async function patchParticipant(p: Participant, fields: Partial<Participant>) {
    setParticipants((list) => list.map((x) => (x.id === p.id ? { ...x, ...fields } : x)));
    try {
      await updateParticipant(p.id, fields);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Unknown error');
      load();
    }
  }

  function removeParticipant(p: Participant) {
    Alert.alert('Remove participant?', `Remove ${p.name} from this case?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setParticipants((list) => list.filter((x) => x.id !== p.id));
          try {
            await deleteParticipant(p.id);
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message ?? 'Unknown error');
            load();
          }
        },
      },
    ]);
  }

  async function onAddNote() {
    if (!id || !noteBody.trim()) return;
    setSavingNote(true);
    try {
      const n = await addCaseNote(id, noteBody.trim());
      setNotes((list) => [n, ...list]);
      setNoteBody('');
    } catch (e: any) {
      Alert.alert('Could not add note', e?.message ?? 'Unknown error');
    } finally {
      setSavingNote(false);
    }
  }

  function removeNote(n: CaseNote) {
    Alert.alert('Delete note?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setNotes((list) => list.filter((x) => x.id !== n.id));
          try {
            await deleteCaseNote(n.id);
          } catch {
            load();
          }
        },
      },
    ]);
  }

  const doneCount = READINESS_WORKFLOW.filter((w) => steps[w.key] === 'done').length;

  if (loading) {
    return (
      <View style={styles.flex}>
        <AppHeader title="Family Readiness" />
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <AppHeader title="Family Readiness" />
      <ScreenContainer underHeader>
        {/* Workflow */}
        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <H2>Workflow</H2>
            <Badge label={`${doneCount}/7 done`} tone={doneCount === 7 ? 'success' : 'gold'} />
          </View>
          <View style={styles.stepList}>
            {READINESS_WORKFLOW.map((w) => {
              const status = steps[w.key] ?? 'todo';
              const icon = stepIcon(status);
              return (
                <Pressable key={w.key} style={styles.stepRow} onPress={() => cycleStep(w.key)}>
                  <Ionicons name={icon.name} size={24} color={icon.color} />
                  <View style={styles.stepText}>
                    <Body
                      style={[
                        styles.stepTitle,
                        status === 'done' && styles.stepTitleDone,
                      ]}
                    >
                      {w.title}
                    </Body>
                    <Muted>{w.detail}</Muted>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Muted style={styles.hint}>Tap a step to cycle: To do → In progress → Done.</Muted>
        </Card>

        {/* Participants */}
        <Card style={styles.card}>
          <H2>Participants</H2>
          {participants.length === 0 ? (
            <Muted style={styles.hint}>No participants yet.</Muted>
          ) : (
            <View style={styles.participantList}>
              {participants.map((p) => (
                <View key={p.id} style={styles.participant}>
                  <View style={styles.participantTop}>
                    <View style={styles.flexShrink}>
                      <Body style={styles.pName}>{p.name}</Body>
                      {p.role ? <Muted>{p.role}</Muted> : null}
                    </View>
                    <Pressable onPress={() => removeParticipant(p)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
                    </Pressable>
                  </View>
                  <View style={styles.participantControls}>
                    <Pressable
                      style={[
                        styles.toggle,
                        p.status === 'ready' ? styles.toggleReady : styles.togglePrep,
                      ]}
                      onPress={() =>
                        patchParticipant(p, { status: p.status === 'ready' ? 'prep' : 'ready' })
                      }
                    >
                      <Ionicons
                        name={p.status === 'ready' ? 'checkmark-circle' : 'time-outline'}
                        size={16}
                        color={p.status === 'ready' ? palette.success : palette.goldDeep}
                      />
                      <Body style={styles.toggleText}>
                        {p.status === 'ready' ? 'Ready' : 'Prep'}
                      </Body>
                    </Pressable>
                    <Pressable
                      style={[styles.toggle, p.letter_in ? styles.toggleReady : styles.toggleOff]}
                      onPress={() => patchParticipant(p, { letter_in: !p.letter_in })}
                    >
                      <Ionicons
                        name={p.letter_in ? 'mail-open' : 'mail-outline'}
                        size={16}
                        color={p.letter_in ? palette.success : palette.textMuted}
                      />
                      <Body style={styles.toggleText}>Letter in</Body>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addForm}>
            <Label>Add participant</Label>
            <Field value={newName} onChangeText={setNewName} placeholder="Name" autoCapitalize="words" />
            <Field value={newRole} onChangeText={setNewRole} placeholder="Role (e.g. Mother, Brother)" autoCapitalize="words" />
            <Button title="Add participant" variant="secondary" onPress={onAddParticipant} />
          </View>
        </Card>

        {/* Notes */}
        <Card style={styles.card}>
          <H2>Case notes</H2>
          <View style={styles.addForm}>
            <Field
              value={noteBody}
              onChangeText={setNoteBody}
              placeholder="Add a note…"
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
            <Button title="Add note" onPress={onAddNote} loading={savingNote} />
          </View>
          {notes.length === 0 ? (
            <Muted style={styles.hint}>No notes yet.</Muted>
          ) : (
            <View style={styles.noteList}>
              {notes.map((n) => (
                <View key={n.id} style={styles.note}>
                  <View style={styles.noteHead}>
                    <Muted>{new Date(n.created_at).toLocaleString()}</Muted>
                    <Pressable onPress={() => removeNote(n)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={18} color={palette.textMuted} />
                    </Pressable>
                  </View>
                  <Body>{n.body}</Body>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  loader: { marginTop: spacing.xxl },
  card: { marginBottom: spacing.lg },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { marginTop: spacing.md },
  stepList: { marginTop: spacing.md, gap: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm },
  stepText: { flex: 1 },
  stepTitle: { fontWeight: '600' },
  stepTitleDone: { color: palette.textMuted },
  participantList: { marginTop: spacing.md, gap: spacing.md },
  participant: {
    borderWidth: 1,
    borderColor: palette.lineSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  participantTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flexShrink: { flexShrink: 1, paddingRight: spacing.sm },
  pName: { fontWeight: '600', fontSize: 16 },
  participantControls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  togglePrep: { backgroundColor: '#F6E6C8', borderColor: '#F6E6C8' },
  toggleReady: { backgroundColor: '#D9EDE2', borderColor: '#D9EDE2' },
  toggleOff: { backgroundColor: palette.ivoryDeep, borderColor: palette.ivoryDeep },
  toggleText: { fontSize: 13, fontWeight: '600' },
  addForm: { marginTop: spacing.lg },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  noteList: { marginTop: spacing.md, gap: spacing.md },
  note: {
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
    paddingTop: spacing.md,
  },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
});
