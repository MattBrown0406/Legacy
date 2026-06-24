import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { updatePractitioner } from '@/data/practitioner';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Button, Card, Field, H1, H2, Label, Muted } from '@/components/ui';
import { palette, spacing } from '@/theme';

const INVITE_CODE = 'FREEDOM2026';

export default function SettingsScreen() {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [credential, setCredential] = useState(profile?.credential ?? '');
  const [practiceName, setPracticeName] = useState(profile?.practice_name ?? '');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setName(profile?.name ?? '');
    setCredential(profile?.credential ?? '');
    setPracticeName(profile?.practice_name ?? '');
    setEditing(true);
  }

  async function save() {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updatePractitioner(profile.id, {
        name: name.trim(),
        credential: credential.trim() || null,
        practice_name: practiceName.trim() || null,
      });
      await refreshProfile();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    await Clipboard.setStringAsync(INVITE_CODE);
    Alert.alert('Copied', `Invite code ${INVITE_CODE} copied to clipboard.`);
  }

  return (
    <ScreenContainer>
      <H1 style={styles.title}>Settings</H1>

      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <H2>Profile</H2>
          {!editing ? <Button title="Edit" variant="ghost" onPress={startEdit} style={styles.editBtn} /> : null}
        </View>
        {editing ? (
          <View style={styles.form}>
            <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field
              label="Credential"
              value={credential}
              onChangeText={setCredential}
              autoCapitalize="characters"
            />
            <Field
              label="Practice name"
              value={practiceName}
              onChangeText={setPracticeName}
              autoCapitalize="words"
            />
            <Button title="Save" onPress={save} loading={saving} />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setEditing(false)}
              style={styles.cancel}
            />
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Label>Name</Label>
              <Body>{profile?.name ?? '—'}</Body>
            </View>
            <View style={styles.row}>
              <Label>Credential</Label>
              <Body>{profile?.credential ?? '—'}</Body>
            </View>
            <View style={styles.row}>
              <Label>Practice</Label>
              <Body>{profile?.practice_name ?? '—'}</Body>
            </View>
            <View style={styles.row}>
              <Label>Account</Label>
              <Body>{session?.user.email ?? '—'}</Body>
            </View>
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <H2>Google Calendar</H2>
        <Muted style={styles.note}>
          One-way sync (Legacy → Google) is added in a later build step.
        </Muted>
      </Card>

      <Card style={styles.card}>
        <H2>Your invite code</H2>
        <Body style={styles.code}>{INVITE_CODE}</Body>
        <Button title="Copy code" variant="ghost" onPress={copyCode} />
      </Card>

      <Button title="Sign out" variant="danger" onPress={signOut} style={styles.signout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { borderColor: 'transparent', minHeight: 0 },
  form: { marginTop: spacing.md },
  cancel: { marginTop: spacing.xs, borderColor: 'transparent' },
  row: { marginTop: spacing.md },
  note: { marginTop: spacing.sm },
  code: {
    fontSize: 22,
    letterSpacing: 2,
    color: palette.gold,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  signout: { marginTop: spacing.sm },
});
