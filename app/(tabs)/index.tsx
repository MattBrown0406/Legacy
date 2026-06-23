import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Body, Card, H1, Muted } from '@/components/ui';
import { spacing } from '@/theme';

// Phase 2 replaces this with the two-pipeline case list.
export default function CasesScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <H1>Cases</H1>
        <Muted>Intervention & Coaching pipelines</Muted>
      </View>
      <Card>
        <Body>Your caseload will live here.</Body>
        <Muted style={styles.note}>Pipelines, case creation, and case detail arrive in the next build step.</Muted>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  note: { marginTop: spacing.sm },
});
