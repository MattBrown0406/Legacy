import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { listCases, updateCaseFields } from '@/data/cases';
import { formatMoney } from '@/lib/money';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge, Body, Card, H1, H2, Muted } from '@/components/ui';
import { Case } from '@/types';
import { palette, spacing } from '@/theme';

export default function RevenueScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setCases(await listCases(profile.id));
    } catch (e) {
      console.warn('[Legacy] revenue load failed', e);
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

  async function togglePaid(c: Case) {
    const next = !c.paid;
    setCases((list) => list.map((x) => (x.id === c.id ? { ...x, paid: next } : x)));
    try {
      await updateCaseFields(c.id, { paid: next });
    } catch (e) {
      console.warn('[Legacy] togglePaid failed', e);
      load();
    }
  }

  const now = new Date();
  const inMonth = (c: Case) => {
    const d = new Date(c.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const inYear = (c: Case) => new Date(c.created_at).getFullYear() === now.getFullYear();
  const sum = (list: Case[]) => list.reduce((t, c) => t + (c.fee_cents || 0), 0);

  const billed = cases.filter((c) => c.fee_cents > 0);
  const monthTotal = sum(billed.filter(inMonth));
  const yearCases = billed.filter(inYear);
  const yearTotal = sum(yearCases);
  const yearPaid = sum(yearCases.filter((c) => c.paid));
  const yearOutstanding = yearTotal - yearPaid;

  const monthName = now.toLocaleDateString([], { month: 'long' });

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
      <H1 style={styles.title}>Revenue</H1>

      <View style={styles.metrics}>
        <Card style={styles.metric}>
          <Muted>{monthName}</Muted>
          <Body style={styles.metricValue}>{formatMoney(monthTotal)}</Body>
        </Card>
        <Card style={styles.metric}>
          <Muted>{now.getFullYear()}</Muted>
          <Body style={styles.metricValue}>{formatMoney(yearTotal)}</Body>
        </Card>
      </View>

      <View style={styles.metrics}>
        <Card style={styles.metric}>
          <Muted>Paid (year)</Muted>
          <Body style={[styles.metricValue, styles.paidValue]}>{formatMoney(yearPaid)}</Body>
        </Card>
        <Card style={styles.metric}>
          <Muted>Outstanding</Muted>
          <Body style={styles.metricValue}>{formatMoney(yearOutstanding)}</Body>
        </Card>
      </View>

      <H2 style={styles.sectionHead}>Cases</H2>
      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : billed.length === 0 ? (
        <Card>
          <Body>No fees yet.</Body>
          <Muted style={styles.note}>
            Add a fee when you create a case, or edit one from its detail screen.
          </Muted>
        </Card>
      ) : (
        billed.map((c) => (
          <Card key={c.id} style={styles.caseCard}>
            <View style={styles.caseRow}>
              <Pressable style={styles.caseInfo} onPress={() => router.push(`/case/${c.id}`)}>
                <Body style={styles.caseName}>{c.family_name}</Body>
                <Muted>
                  {c.pipeline === 'intervention' ? 'Intervention' : 'Coaching'} ·{' '}
                  {new Date(c.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </Muted>
              </Pressable>
              <View style={styles.caseRight}>
                <Body style={styles.caseAmount}>{formatMoney(c.fee_cents)}</Body>
                <Pressable onPress={() => togglePaid(c)}>
                  <Badge label={c.paid ? 'Paid' : 'Unpaid'} tone={c.paid ? 'success' : 'gold'} />
                </Pressable>
              </View>
            </View>
          </Card>
        ))
      )}
      <Muted style={styles.footnote}>Tap a status badge to mark paid / unpaid.</Muted>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  metrics: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  metric: { flex: 1 },
  metricValue: { fontSize: 22, fontWeight: '700', color: palette.navy, marginTop: spacing.xs },
  paidValue: { color: palette.success },
  sectionHead: { marginTop: spacing.lg, marginBottom: spacing.sm },
  loader: { marginTop: spacing.xl },
  note: { marginTop: spacing.sm },
  caseCard: { marginBottom: spacing.md },
  caseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caseInfo: { flex: 1, paddingRight: spacing.md },
  caseName: { fontWeight: '600', fontSize: 16 },
  caseRight: { alignItems: 'flex-end', gap: spacing.xs },
  caseAmount: { fontWeight: '700', fontSize: 16, color: palette.navy },
  footnote: { marginTop: spacing.md },
});
