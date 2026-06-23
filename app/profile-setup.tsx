import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Lighthouse } from '@/components/Lighthouse';
import { Button, Field, H1, Muted } from '@/components/ui';
import { palette, spacing } from '@/theme';

export default function ProfileSetup() {
  const { session, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [credential, setCredential] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your name to continue.');
      return;
    }
    if (!session) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('practitioners').insert({
        user_id: session.user.id,
        name: name.trim(),
        credential: credential.trim() || null,
        practice_name: practiceName.trim() || null,
      });
      if (error) throw error;
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Could not save profile', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.markWrap}>
          <Lighthouse size={56} />
        </View>
        <H1>Your practice</H1>
        <Muted style={styles.sub}>Set up your practitioner profile.</Muted>
      </View>

      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Matt Brown"
        autoCapitalize="words"
      />
      <Field
        label="Credential"
        value={credential}
        onChangeText={setCredential}
        placeholder="CIP"
        autoCapitalize="characters"
      />
      <Field
        label="Practice name"
        value={practiceName}
        onChangeText={setPracticeName}
        placeholder="Freedom Interventions"
        autoCapitalize="words"
      />

      <Button title="Continue" onPress={save} loading={busy} />
      <Button title="Sign out" variant="ghost" onPress={signOut} style={styles.signout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  markWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sub: { marginTop: spacing.xs },
  signout: { marginTop: spacing.sm, borderColor: 'transparent' },
});
