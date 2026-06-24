import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { createDocument } from '@/data/documents';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button, Field } from '@/components/ui';
import { palette, spacing } from '@/theme';

export default function NewDocumentScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!profile) return;
    if (!title.trim()) {
      Alert.alert('Title required', 'Give the document a title.');
      return;
    }
    setBusy(true);
    try {
      const created = await createDocument(profile.id, { title: title.trim(), body_md: body });
      router.replace(`/document/${created.id}`);
    } catch (e: any) {
      Alert.alert('Could not create', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.flex}>
      <AppHeader title="New document" />
      <ScreenContainer underHeader>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Document title" />
        <Field
          label="Content"
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Write the document…"
          style={styles.bodyInput}
        />
        <Button title="Create document" onPress={save} loading={busy} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  bodyInput: { minHeight: 220, textAlignVertical: 'top' },
});
