import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { createCase } from '@/data/cases';
import { parseDollarsToCents } from '@/lib/money';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Button, Field, Label, Muted, SegmentedControl } from '@/components/ui';
import { Pipeline } from '@/types';
import { palette, spacing } from '@/theme';

export default function NewCaseScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [familyName, setFamilyName] = useState('');
  const [lovedOne, setLovedOne] = useState('');
  const [substance, setSubstance] = useState('');
  const [pipeline, setPipeline] = useState<Pipeline>('intervention');
  const [fee, setFee] = useState('');
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!familyName.trim()) {
      Alert.alert('Family name required', 'Enter a family name for this case.');
      return;
    }
    if (!profile) return;
    setBusy(true);
    try {
      const created = await createCase(profile.id, {
        family_name: familyName.trim(),
        loved_one: lovedOne.trim() || null,
        substance: substance.trim() || null,
        pipeline,
        fee_cents: parseDollarsToCents(fee) ?? 0,
        paid,
      });
      router.replace(`/case/${created.id}`);
    } catch (e: any) {
      Alert.alert('Could not create case', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.flex}>
      <AppHeader title="New case" />
      <ScreenContainer underHeader>
        <View style={styles.field}>
          <Label>Pipeline</Label>
          <SegmentedControl
            value={pipeline}
            onChange={setPipeline}
            options={[
              { value: 'intervention', label: 'Intervention' },
              { value: 'coaching', label: 'Coaching' },
            ]}
          />
        </View>

        <Field
          label="Family name"
          value={familyName}
          onChangeText={setFamilyName}
          placeholder="Henderson"
          autoCapitalize="words"
        />
        <Field
          label="Loved one"
          value={lovedOne}
          onChangeText={setLovedOne}
          placeholder="Name of the person of concern"
          autoCapitalize="words"
        />
        <Field
          label="Substance / focus"
          value={substance}
          onChangeText={setSubstance}
          placeholder="Alcohol"
          autoCapitalize="sentences"
        />

        <Field
          label="Fee (USD)"
          value={fee}
          onChangeText={setFee}
          placeholder="2500"
          keyboardType="decimal-pad"
        />
        <View style={styles.paidRow}>
          <View style={styles.paidText}>
            <Body style={styles.paidTitle}>Paid</Body>
            <Muted>Mark on if the family has paid this fee.</Muted>
          </View>
          <Switch value={paid} onValueChange={setPaid} trackColor={{ true: palette.gold }} />
        </View>

        <Button title="Create case" onPress={save} loading={busy} style={styles.submit} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  field: { marginBottom: spacing.lg },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  paidText: { flex: 1 },
  paidTitle: { fontWeight: '600' },
  submit: { marginTop: spacing.sm },
});
