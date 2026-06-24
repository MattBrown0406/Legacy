import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { DOCUMENT_KIND_LABELS, ensureDefaultDocuments } from '@/data/documents';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge, Body, Card, H1, Muted } from '@/components/ui';
import { DocumentTemplate } from '@/types';
import { palette, radius, spacing } from '@/theme';

export default function DocsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      // Seeds the three default templates the first time.
      const rows = await ensureDefaultDocuments(profile.id);
      setDocs(rows);
    } catch (e) {
      console.warn('[Legacy] documents load failed', e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenContainer>
      <View style={styles.titleRow}>
        <View>
          <H1>Documents</H1>
          <Muted>Templates to share with families</Muted>
        </View>
        <Pressable style={styles.addBtn} onPress={() => router.push('/document/new')} hitSlop={8}>
          <Ionicons name="add" size={24} color={palette.white} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : (
        docs.map((d) => (
          <Card key={d.id} style={styles.docCard} onPress={() => router.push(`/document/${d.id}`)}>
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Body style={styles.docTitle}>{d.title}</Body>
                <Badge label={DOCUMENT_KIND_LABELS[d.kind]} tone="gold" />
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: spacing.xxl },
  docCard: { marginBottom: spacing.md },
  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docInfo: { flex: 1, gap: spacing.sm },
  docTitle: { fontWeight: '600', fontSize: 17 },
});
