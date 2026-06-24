import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  deleteDocument,
  getDocument,
  updateDocument,
} from '@/data/documents';
import { shareContent } from '@/lib/share';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Button, Card, Field } from '@/components/ui';
import { DocumentTemplate } from '@/types';
import { palette, spacing } from '@/theme';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDocument(id)
      .then((d) => {
        setDoc(d);
        if (d) {
          setTitle(d.title);
          setBody(d.body_md);
        }
      })
      .catch((e) => console.warn('[Legacy] getDocument failed', e))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!id || !title.trim()) {
      Alert.alert('Title required', 'Give the document a title.');
      return;
    }
    setSaving(true);
    try {
      await updateDocument(id, { title: title.trim(), body_md: body });
      Alert.alert('Saved', 'Document updated.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    const result = await shareContent({ title: title, message: `${title}\n\n${body}` });
    if (result === 'copied') Alert.alert('Copied', 'Document copied to clipboard.');
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert('Delete document?', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(id);
            router.back();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Unknown error');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <AppHeader
        title="Document"
        right={
          <Pressable onPress={send} hitSlop={10}>
            <Ionicons name="share-outline" size={22} color={palette.white} />
          </Pressable>
        }
      />
      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : !doc ? (
        <ScreenContainer underHeader>
          <Card>
            <Body>Document not found.</Body>
          </Card>
        </ScreenContainer>
      ) : (
        <ScreenContainer underHeader>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field
            label="Content"
            value={body}
            onChangeText={setBody}
            multiline
            style={styles.bodyInput}
          />
          <Button title="Send to family" variant="secondary" onPress={send} />
          <Button title="Save changes" onPress={save} loading={saving} style={styles.save} />
          <Button title="Delete document" variant="danger" onPress={confirmDelete} style={styles.del} />
        </ScreenContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  loader: { marginTop: spacing.xxl },
  bodyInput: { minHeight: 260, textAlignVertical: 'top' },
  save: { marginTop: spacing.md },
  del: { marginTop: spacing.lg },
});
