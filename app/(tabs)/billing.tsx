import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import {
  createInvoice,
  deleteInvoice,
  formatMoney,
  listInvoices,
  parseDollarsToCents,
  setInvoiceStatus,
} from '@/data/invoices';
import { listCases } from '@/data/cases';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge, Body, Button, Card, Field, H1, H2, Label, Muted } from '@/components/ui';
import { Case, Invoice } from '@/types';
import { palette, radius, spacing } from '@/theme';

export default function BillingScreen() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const caseNames: Record<string, string> = {};
  cases.forEach((c) => (caseNames[c.id] = c.family_name));

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [inv, cs] = await Promise.all([listInvoices(profile.id), listCases(profile.id)]);
      setInvoices(inv);
      setCases(cs);
    } catch (e) {
      console.warn('[Legacy] billing load failed', e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function add() {
    if (!profile) return;
    if (!item.trim()) {
      Alert.alert('Item required', 'Describe what this invoice is for.');
      return;
    }
    const cents = parseDollarsToCents(amount);
    if (cents == null) {
      Alert.alert('Amount required', 'Enter a dollar amount.');
      return;
    }
    setSaving(true);
    try {
      const created = await createInvoice(profile.id, {
        item: item.trim(),
        amount_cents: cents,
        case_id: caseId,
      });
      setInvoices((list) => [created, ...list]);
      setItem('');
      setAmount('');
      setCaseId(null);
    } catch (e: any) {
      Alert.alert('Could not add invoice', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(inv: Invoice) {
    const next = inv.status === 'paid' ? 'unpaid' : 'paid';
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, status: next } : x)));
    try {
      await setInvoiceStatus(inv.id, next);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Unknown error');
      load();
    }
  }

  function remove(inv: Invoice) {
    Alert.alert('Delete invoice?', `Delete "${inv.item}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setInvoices((list) => list.filter((x) => x.id !== inv.id));
          try {
            await deleteInvoice(inv.id);
          } catch {
            load();
          }
        },
      },
    ]);
  }

  const outstanding = invoices
    .filter((i) => i.status === 'unpaid')
    .reduce((sum, i) => sum + i.amount_cents, 0);
  const paid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <ScreenContainer>
      <H1 style={styles.title}>Billing</H1>

      <View style={styles.totals}>
        <Card style={styles.totalCard}>
          <Muted>Outstanding</Muted>
          <Body style={styles.totalValue}>{formatMoney(outstanding)}</Body>
        </Card>
        <Card style={styles.totalCard}>
          <Muted>Paid</Muted>
          <Body style={[styles.totalValue, styles.paidValue]}>{formatMoney(paid)}</Body>
        </Card>
      </View>

      <Card style={styles.card}>
        <H2>New invoice</H2>
        <View style={styles.form}>
          <Field label="Item" value={item} onChangeText={setItem} placeholder="Intervention package" />
          <Field
            label="Amount (USD)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="2500"
          />
          {cases.length > 0 ? (
            <View style={styles.group}>
              <Label>Link to case (optional)</Label>
              <View style={styles.chipRow}>
                <Chip label="None" active={caseId === null} onPress={() => setCaseId(null)} />
                {cases.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.family_name}
                    active={caseId === c.id}
                    onPress={() => setCaseId(c.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <Button title="Add invoice" onPress={add} loading={saving} />
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : invoices.length === 0 ? (
        <Card>
          <Body>No invoices yet.</Body>
        </Card>
      ) : (
        invoices.map((inv) => (
          <Card key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invoiceTop}>
              <View style={styles.invoiceInfo}>
                <Body style={styles.invoiceItem}>{inv.item}</Body>
                {inv.case_id && caseNames[inv.case_id] ? (
                  <Muted>{caseNames[inv.case_id]}</Muted>
                ) : null}
              </View>
              <View style={styles.invoiceRight}>
                <Body style={styles.amount}>{formatMoney(inv.amount_cents)}</Body>
                <Badge
                  label={inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                  tone={inv.status === 'paid' ? 'success' : 'gold'}
                />
              </View>
            </View>
            <View style={styles.invoiceActions}>
              <Button
                title={inv.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                variant="ghost"
                onPress={() => togglePaid(inv)}
                style={styles.actionBtn}
              />
              <Pressable onPress={() => remove(inv)} hitSlop={10} style={styles.trash}>
                <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Body style={[styles.chipText, active && styles.chipTextActive]}>{label}</Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  totals: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  totalCard: { flex: 1 },
  totalValue: { fontSize: 22, fontWeight: '700', color: palette.navy, marginTop: spacing.xs },
  paidValue: { color: palette.success },
  card: { marginBottom: spacing.lg },
  form: { marginTop: spacing.md },
  group: { marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  chipActive: { backgroundColor: palette.navy, borderColor: palette.navy },
  chipText: { fontSize: 14, color: palette.text },
  chipTextActive: { color: palette.white, fontWeight: '600' },
  loader: { marginTop: spacing.xxl },
  invoiceCard: { marginBottom: spacing.md },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceInfo: { flex: 1, paddingRight: spacing.md },
  invoiceItem: { fontWeight: '600', fontSize: 16 },
  invoiceRight: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { fontWeight: '700', fontSize: 16, color: palette.navy },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionBtn: { flex: 1, marginRight: spacing.md },
  trash: { padding: spacing.sm },
});
