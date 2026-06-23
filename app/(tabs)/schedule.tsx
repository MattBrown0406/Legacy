import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Card, H1, Muted } from '@/components/ui';
import { spacing } from '@/theme';

// Phase 4 replaces this with appointments + local push reminders.
export default function ScheduleScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <H1>Schedule</H1>
        <Muted>Appointments live in Legacy</Muted>
      </View>
      <Card>
        <Body>Your appointments will live here.</Body>
        <Muted style={styles.note}>Appointment list, day view, and push reminders arrive in a later build step.</Muted>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  note: { marginTop: spacing.sm },
});
