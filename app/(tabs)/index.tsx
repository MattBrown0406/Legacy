import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { listCases } from '@/data/cases';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Card, H1, H2, Muted, SegmentedControl } from '@/components/ui';
import { Case, Pipeline, STAGE_LABELS, stagesForPipeline } from '@/types';
import { palette, radius, spacing } from '@/theme';

export default function CasesScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Pipeline>('intervention');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const rows = await listCases(profile.id);
      setCases(rows);
    } catch (e) {
      console.warn('[Legacy] listCases failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const inPipeline = cases.filter((c) => c.pipeline === pipeline);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={palette.navy}
        />
      }
    >
      <View style={styles.titleRow}>
        <View>
          <H1>Cases</H1>
          <Muted>{cases.length} total</Muted>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/case/new')}
          hitSlop={8}
        >
          <Ionicons name="add" size={24} color={palette.white} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl
          value={pipeline}
          onChange={setPipeline}
          options={[
            { value: 'intervention', label: 'Intervention' },
            { value: 'coaching', label: 'Coaching' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : inPipeline.length === 0 ? (
        <Card style={styles.empty}>
          <Body>No {pipeline} cases yet.</Body>
          <Muted style={styles.note}>Tap + to create your first case.</Muted>
        </Card>
      ) : (
        stagesForPipeline(pipeline).map((stage) => {
          const stageCases = inPipeline.filter((c) => c.stage === stage);
          if (stageCases.length === 0) return null;
          return (
            <View key={stage} style={styles.stageGroup}>
              <H2 style={styles.stageHeading}>{STAGE_LABELS[stage]}</H2>
              {stageCases.map((c) => (
                <Card
                  key={c.id}
                  style={styles.caseCard}
                  onPress={() => router.push(`/case/${c.id}`)}
                >
                  <View style={styles.caseRow}>
                    <View style={styles.caseInfo}>
                      <Body style={styles.caseName}>{c.family_name}</Body>
                      {c.loved_one ? (
                        <Muted>
                          {c.loved_one}
                          {c.substance ? ` · ${c.substance}` : ''}
                        </Muted>
                      ) : c.substance ? (
                        <Muted>{c.substance}</Muted>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
                  </View>
                </Card>
              ))}
            </View>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: { marginBottom: spacing.xl },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'flex-start' },
  note: { marginTop: spacing.sm },
  stageGroup: { marginBottom: spacing.xl },
  stageHeading: { marginBottom: spacing.md },
  caseCard: { marginBottom: spacing.md },
  caseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caseInfo: { flex: 1 },
  caseName: { fontWeight: '600', fontSize: 17 },
});
