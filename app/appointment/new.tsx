import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { AppointmentInput, createAppointment } from '@/data/appointments';
import { listCases } from '@/data/cases';
import { scheduleReminder } from '@/lib/reminders';
import { syncAppointmentToGcal } from '@/lib/gcal';
import { AppHeader } from '@/components/AppHeader';
import { AppointmentForm } from '@/components/AppointmentForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Case } from '@/types';
import { palette, spacing } from '@/theme';

export default function NewAppointmentScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  // Optional ?caseId= to preselect when coming from a case.
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listCases(profile.id)
      .then(setCases)
      .catch((e) => console.warn('[Legacy] listCases failed', e))
      .finally(() => setLoading(false));
  }, [profile]);

  async function onSubmit(input: AppointmentInput) {
    if (!profile) return;
    const created = await createAppointment(profile.id, input);
    await scheduleReminder(created);
    if (profile.gcal_email) await syncAppointmentToGcal(created.id);
    router.back();
  }

  return (
    <View style={styles.flex}>
      <AppHeader title="New appointment" />
      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : (
        <ScreenContainer underHeader>
          <AppointmentForm
            cases={cases}
            submitLabel="Create appointment"
            onSubmit={onSubmit}
            initialCaseId={caseId ?? null}
          />
        </ScreenContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  loader: { marginTop: spacing.xxl },
});
