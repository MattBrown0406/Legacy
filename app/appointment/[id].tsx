import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import {
  AppointmentInput,
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from '@/data/appointments';
import { listCases } from '@/data/cases';
import { cancelReminder, scheduleReminder } from '@/lib/reminders';
import { removeAppointmentFromGcal, syncAppointmentToGcal } from '@/lib/gcal';
import { AppHeader } from '@/components/AppHeader';
import { AppointmentForm } from '@/components/AppointmentForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Button, Card } from '@/components/ui';
import { Appointment, Case } from '@/types';
import { palette, spacing } from '@/theme';

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !id) return;
    Promise.all([getAppointment(id), listCases(profile.id)])
      .then(([a, cs]) => {
        setAppt(a);
        setCases(cs);
      })
      .catch((e) => console.warn('[Legacy] load appointment failed', e))
      .finally(() => setLoading(false));
  }, [profile, id]);

  async function onSubmit(input: AppointmentInput) {
    if (!id) return;
    const updated = await updateAppointment(id, input);
    await scheduleReminder(updated);
    if (profile?.gcal_email) await syncAppointmentToGcal(updated.id);
    router.back();
  }

  function confirmDelete() {
    if (!appt) return;
    Alert.alert('Delete appointment?', `Delete "${appt.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReminder(appt.id);
            if (profile?.gcal_email) await removeAppointmentFromGcal(appt.gcal_event_id);
            await deleteAppointment(appt.id);
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
        title="Edit appointment"
        right={
          appt ? (
            <Pressable onPress={confirmDelete} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color={palette.white} />
            </Pressable>
          ) : undefined
        }
      />
      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : !appt ? (
        <ScreenContainer underHeader>
          <Card>
            <Body>Appointment not found.</Body>
          </Card>
        </ScreenContainer>
      ) : (
        <ScreenContainer underHeader>
          <AppointmentForm
            cases={cases}
            initial={appt}
            submitLabel="Save changes"
            onSubmit={onSubmit}
          />
          <Button title="Delete appointment" variant="danger" onPress={confirmDelete} style={styles.del} />
        </ScreenContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  loader: { marginTop: spacing.xxl },
  del: { marginTop: spacing.lg },
});
