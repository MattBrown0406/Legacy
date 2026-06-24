import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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
import {
  deleteCaseFile,
  formatBytes,
  listCaseFiles,
  openCaseFile,
  pickAndUploadCaseFile,
} from '@/lib/files';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge, Body, Button, Card, Field, H2, Muted } from '@/components/ui';
import {
  CaseFile,
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
  const [files, setFiles] = useState<CaseFile[]>([]);

  // new participant form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // participant edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);

  // collapsible add forms (hidden until the + in the card header is tapped)
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [stepRows, pRows, nRows, fRows] = await Promise.all([
        listReadinessSteps(id),
        listParticipants(id),
        listCaseNotes(id),
        listCaseFiles(id),
      ]);
      const map: Record<string, ReadinessStatus> = {};
      stepRows.forEach((s: ReadinessStep) => (map[s.step_key] = s.status));
      setSteps(map);
      setParticipants(pRows);
      setNotes(nRows);
      setFiles(fRows);
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
      const p = await addParticipant(id, {
        name: newName.trim(),
        role: newRole.trim() || null,
        phone: newPhone.trim() || null,
        email: newEmail.trim() || null,
      });
      setParticipants((list) => [...list, p]);
      setNewName('');
      setNewRole('');
      setNewPhone('');
      setNewEmail('');
    } catch (e: any) {
      Alert.alert('Could not add participant', e?.message ?? 'Unknown error');
    }
  }

  function startEdit(p: Participant) {
    setEditId(p.id);
    setEditName(p.name);
    setEditRole(p.role ?? '');
    setEditPhone(p.phone ?? '');
    setEditEmail(p.email ?? '');
  }

  async function saveEdit(p: Participant) {
    if (!editName.trim()) {
      Alert.alert('Name required', 'Enter a name.');
      return;
    }
    const fields = {
      name: editName.trim(),
      role: editRole.trim() || null,
      phone: editPhone.trim() || null,
      email: editEmail.trim() || null,
    };
    setParticipants((list) => list.map((x) => (x.id === p.id ? { ...x, ...fields } : x)));
    setEditId(null);
    try {
      await updateParticipant(p.id, fields);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
      load();
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

  async function onUpload() {
    if (!id) return;
    setUploading(true);
    try {
      const f = await pickAndUploadCaseFile(id);
      if (f) setFiles((list) => [f, ...list]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
    }
  }

  async function onOpenFile(f: CaseFile) {
    try {
      await openCaseFile(f);
    } catch (e: any) {
      Alert.alert('Could not open file', e?.message ?? 'Unknown error');
    }
  }

  function onDeleteFile(f: CaseFile) {
    Alert.alert('Delete file?', `Delete "${f.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setFiles((list) => list.filter((x) => x.id !== f.id));
          try {
            await deleteCaseFile(f);
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Unknown error');
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
                    <Body style={[styles.stepTitle, status === 'done' && styles.stepTitleDone]}>
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
          <View style={styles.cardHead}>
            <H2>Participants</H2>
            <Pressable onPress={() => setShowAddPart((v) => !v)} hitSlop={8}>
              <Ionicons name={showAddPart ? 'close' : 'add'} size={24} color={palette.navy} />
            </Pressable>
          </View>
          {participants.length === 0 ? (
            <Muted style={styles.hint}>No participants yet.</Muted>
          ) : (
            <View style={styles.participantList}>
              {participants.map((p) =>
                editId === p.id ? (
                  <View key={p.id} style={styles.participant}>
                    <Field label="Name" value={editName} onChangeText={setEditName} />
                    <Field label="Role" value={editRole} onChangeText={setEditRole} placeholder="Mother, Brother…" />
                    <Field
                      label="Phone"
                      value={editPhone}
                      onChangeText={setEditPhone}
                      keyboardType="phone-pad"
                      placeholder="(555) 123-4567"
                    />
                    <Field
                      label="Email"
                      value={editEmail}
                      onChangeText={setEditEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="name@email.com"
                    />
                    <Button title="Save" onPress={() => saveEdit(p)} />
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={() => setEditId(null)}
                      style={styles.cancelBtn}
                    />
                  </View>
                ) : (
                  <View key={p.id} style={styles.participant}>
                    <View style={styles.participantTop}>
                      <View style={styles.flexShrink}>
                        <Body style={styles.pName}>{p.name}</Body>
                        {p.role ? <Muted>{p.role}</Muted> : null}
                      </View>
                      <View style={styles.pActions}>
                        <Pressable onPress={() => startEdit(p)} hitSlop={8}>
                          <Ionicons name="create-outline" size={20} color={palette.textMuted} />
                        </Pressable>
                        <Pressable onPress={() => removeParticipant(p)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
                        </Pressable>
                      </View>
                    </View>

                    {p.phone ? (
                      <Pressable
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`tel:${p.phone}`)}
                      >
                        <Ionicons name="call-outline" size={15} color={palette.navy} />
                        <Body style={styles.contactText}>{p.phone}</Body>
                      </Pressable>
                    ) : null}
                    {p.email ? (
                      <Pressable
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`mailto:${p.email}`)}
                      >
                        <Ionicons name="mail-outline" size={15} color={palette.navy} />
                        <Body style={styles.contactText}>{p.email}</Body>
                      </Pressable>
                    ) : null}

                    <View style={styles.participantControls}>
                      <Pressable
                        style={[styles.toggle, p.status === 'ready' ? styles.toggleReady : styles.togglePrep]}
                        onPress={() =>
                          patchParticipant(p, { status: p.status === 'ready' ? 'prep' : 'ready' })
                        }
                      >
                        <Ionicons
                          name={p.status === 'ready' ? 'checkmark-circle' : 'time-outline'}
                          size={16}
                          color={p.status === 'ready' ? palette.success : palette.goldDeep}
                        />
                        <Body style={styles.toggleText}>{p.status === 'ready' ? 'Ready' : 'Prep'}</Body>
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
                ),
              )}
            </View>
          )}

          {showAddPart ? (
            <View style={styles.addForm}>
              <Field value={newName} onChangeText={setNewName} placeholder="Name" autoCapitalize="words" />
              <Field value={newRole} onChangeText={setNewRole} placeholder="Role (e.g. Mother, Brother)" autoCapitalize="words" />
              <Field
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
              <Field
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button title="Add participant" variant="secondary" onPress={onAddParticipant} />
            </View>
          ) : null}
        </Card>

        {/* Case files */}
        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <H2>Case files</H2>
            <Badge label={`${files.length}`} tone="neutral" />
          </View>
          <Muted style={styles.hint}>PDF, Word, Excel, and Apple Pages/Numbers/Keynote.</Muted>
          {files.length > 0 ? (
            <View style={styles.fileList}>
              {files.map((f) => (
                <View key={f.id} style={styles.fileRow}>
                  <Ionicons name="document-text-outline" size={22} color={palette.navy} />
                  <Pressable style={styles.fileInfo} onPress={() => onOpenFile(f)}>
                    <Body style={styles.fileName} numberOfLines={1}>
                      {f.name}
                    </Body>
                    <Muted>{formatBytes(f.size_bytes)}</Muted>
                  </Pressable>
                  <Pressable onPress={() => onDeleteFile(f)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <Button
            title="Upload document"
            variant="secondary"
            onPress={onUpload}
            loading={uploading}
            style={styles.uploadBtn}
          />
        </Card>

        {/* Notes */}
        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <H2>Case notes</H2>
            <Pressable onPress={() => setShowAddNote((v) => !v)} hitSlop={8}>
              <Ionicons name={showAddNote ? 'close' : 'add'} size={24} color={palette.navy} />
            </Pressable>
          </View>
          {showAddNote ? (
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
          ) : null}
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
  pActions: { flexDirection: 'row', gap: spacing.lg },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  contactText: { color: palette.navy, fontSize: 14 },
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
  cancelBtn: { marginTop: spacing.xs, borderColor: 'transparent' },
  addForm: { marginTop: spacing.lg },
  fileList: { marginTop: spacing.md, gap: spacing.sm },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  fileInfo: { flex: 1 },
  fileName: { fontWeight: '600', fontSize: 15 },
  uploadBtn: { marginTop: spacing.lg },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  noteList: { marginTop: spacing.md, gap: spacing.md },
  note: { borderTopWidth: 1, borderTopColor: palette.lineSoft, paddingTop: spacing.md },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
});
