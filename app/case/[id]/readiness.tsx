import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Card, Muted } from '@/components/ui';
import { palette, spacing } from '@/theme';

// Phase 3 fills this in: 7-step workflow + participants + notes.
export default function ReadinessScreen() {
  useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.flex}>
      <AppHeader title="Family Readiness" />
      <ScreenContainer underHeader>
        <Card>
          <Body>Family Readiness workflow.</Body>
          <Muted style={styles.note}>
            The 7-step checklist, participant tracker, and case notes arrive in the next build step.
          </Muted>
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  note: { marginTop: spacing.sm },
});
