import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { createCase } from '@/data/cases';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button, Field, Label, SegmentedControl } from '@/components/ui';
import { Pipeline } from '@/types';
import { palette, spacing } from '@/theme';

export default function NewCaseScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [familyName, setFamilyName] = useState('');
  const [lovedOne, setLovedOne] = useState('');
  const [substance, setSubstance] = useState('');
  const [pipeline, setPipeline] = useState<Pipeline>('intervention');
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

        <Button title="Create case" onPress={save} loading={busy} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  field: { marginBottom: spacing.lg },
});
