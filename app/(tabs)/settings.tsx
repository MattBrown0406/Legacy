import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Button, Card, H1, H2, Label, Muted } from '@/components/ui';
import { palette, spacing } from '@/theme';

const INVITE_CODE = 'FREEDOM2026';

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();

  async function copyCode() {
    await Clipboard.setStringAsync(INVITE_CODE);
    Alert.alert('Copied', `Invite code ${INVITE_CODE} copied to clipboard.`);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <H1>Settings</H1>
      </View>

      <Card style={styles.card}>
        <H2>Profile</H2>
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
  header: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
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
