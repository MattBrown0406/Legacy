import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  deleteCase,
  getCase,
  moveCasePipeline,
  updateCaseFields,
  updateCaseStage,
} from '@/data/cases';
import { INVITE_LINKS, INVITE_TARGETS, lastInvitedByTarget, logInvite } from '@/data/invites';
import { shareContent } from '@/lib/share';
import { AppHeader } from '@/components/AppHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  H2,
  Label,
  Muted,
} from '@/components/ui';
import { Case, InviteTarget, Pipeline, STAGE_LABELS, Stage, stagesForPipeline } from '@/types';
import { palette, radius, spacing } from '@/theme';

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [lovedOne, setLovedOne] = useState('');
  const [substance, setSubstance] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastInvited, setLastInvited] = useState<Partial<Record<InviteTarget, string>>>({});

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const row = await getCase(id);
      setC(row);
      if (row) {
        setFamilyName(row.family_name);
        setLovedOne(row.loved_one ?? '');
        setSubstance(row.substance ?? '');
        setLastInvited(await lastInvitedByTarget(id));
      }
    } catch (e) {
      console.warn('[Legacy] getCase failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function sendInvite(target: InviteTarget) {
    if (!c) return;
    const link = INVITE_LINKS[target];
    const result = await shareContent({
      title: link.label,
      message: `${link.label} — ${link.description}`,
      url: link.url,
    });
    if (result === 'dismissed') return;
    try {
      const inv = await logInvite(c.id, target);
      setLastInvited((m) => ({ ...m, [target]: inv.sent_at }));
      if (result === 'copied') {
        Alert.alert('Link copied', `${link.label} link copied and logged.`);
      }
    } catch (e: any) {
      Alert.alert('Could not log invite', e?.message ?? 'Unknown error');
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function setStage(stage: Stage) {
    if (!c || stage === c.stage) return;
    setC({ ...c, stage });
    try {
      await updateCaseStage(c.id, stage);
    } catch (e: any) {
      Alert.alert('Could not update stage', e?.message ?? 'Unknown error');
      load();
    }
  }

  function confirmMove() {
    if (!c) return;
    const target: Pipeline = c.pipeline === 'intervention' ? 'coaching' : 'intervention';
    const targetLabel = target === 'intervention' ? 'Intervention' : 'Coaching';
    Alert.alert(
      `Move to ${targetLabel}?`,
      'The case keeps its notes, participants, and file. Its stage resets if it does not exist in the new pipeline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Move to ${targetLabel}`,
          onPress: async () => {
            try {
              await moveCasePipeline(c, target);
              await load();
            } catch (e: any) {
              Alert.alert('Could not move case', e?.message ?? 'Unknown error');
            }
          },
        },
      ],
    );
  }

  async function saveEdits() {
    if (!c) return;
    if (!familyName.trim()) {
      Alert.alert('Family name required', 'Enter a family name.');
      return;
    }
    setSaving(true);
    try {
      await updateCaseFields(c.id, {
        family_name: familyName.trim(),
        loved_one: lovedOne.trim() || null,
        substance: substance.trim() || null,
      });
      await load();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!c) return;
    Alert.alert('Delete case?', `This permanently deletes ${c.family_name} and its file.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCase(c.id);
            router.back();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Unknown error');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.flex}>
        <AppHeader title="Case" />
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      </View>
    );
  }

  if (!c) {
    return (
      <View style={styles.flex}>
        <AppHeader title="Case" />
        <ScreenContainer underHeader>
          <Card>
            <Body>Case not found.</Body>
          </Card>
        </ScreenContainer>
      </View>
    );
  }

  const pipelineLabel = c.pipeline === 'intervention' ? 'Intervention' : 'Coaching';
  const otherLabel = c.pipeline === 'intervention' ? 'Coaching' : 'Intervention';

  return (
    <View style={styles.flex}>
      <AppHeader
        title={c.family_name}
        right={
          <Pressable onPress={() => setEditing((v) => !v)} hitSlop={10}>
            <Ionicons
              name={editing ? 'close' : 'create-outline'}
              size={22}
              color={palette.white}
            />
          </Pressable>
        }
      />
      <ScreenContainer underHeader>
        <Card style={styles.card}>
          {editing ? (
            <>
              <Field label="Family name" value={familyName} onChangeText={setFamilyName} />
              <Field label="Loved one" value={lovedOne} onChangeText={setLovedOne} />
              <Field label="Substance / focus" value={substance} onChangeText={setSubstance} />
              <Button title="Save changes" onPress={saveEdits} loading={saving} />
            </>
          ) : (
            <>
              <Badge label={pipelineLabel} tone="navy" />
              <H2 style={styles.familyName}>{c.family_name}</H2>
              {c.loved_one ? (
                <View style={styles.metaRow}>
                  <Label>Loved one</Label>
                  <Body>{c.loved_one}</Body>
                </View>
              ) : null}
              {c.substance ? (
                <View style={styles.metaRow}>
                  <Label>Substance / focus</Label>
                  <Body>{c.substance}</Body>
                </View>
              ) : null}
            </>
          )}
        </Card>

        {c.pipeline === 'intervention' ? (
          <Card
            style={styles.card}
            onPress={() => router.push(`/case/${c.id}/readiness`)}
          >
            <View style={styles.linkRow}>
              <View>
                <H2>Family Readiness</H2>
                <Muted style={styles.note}>7-step workflow, participants, notes</Muted>
              </View>
              <Ionicons name="chevron-forward" size={22} color={palette.textMuted} />
            </View>
          </Card>
        ) : null}

        <Card
          style={styles.card}
          onPress={() => router.push({ pathname: '/appointment/new', params: { caseId: c.id } })}
        >
          <View style={styles.linkRow}>
            <View>
              <H2>Schedule appointment</H2>
              <Muted style={styles.note}>Add a session, call, or the intervention</Muted>
            </View>
            <Ionicons name="add-circle-outline" size={24} color={palette.navy} />
          </View>
        </Card>

        <Card style={styles.card}>
          <H2>Invites</H2>
          <Muted style={styles.note}>Send a resource to the family and log it.</Muted>
          <View style={styles.inviteList}>
            {INVITE_TARGETS.map((target) => {
              const link = INVITE_LINKS[target];
              const sent = lastInvited[target];
              return (
                <View key={target} style={styles.inviteRow}>
                  <View style={styles.inviteInfo}>
                    <Body style={styles.inviteLabel}>{link.label}</Body>
                    <Muted>{link.description}</Muted>
                    {sent ? (
                      <Badge
                        label={`Last sent ${new Date(sent).toLocaleDateString()}`}
                        tone="success"
                      />
                    ) : null}
                  </View>
                  <Button
                    title="Send"
                    variant="secondary"
                    onPress={() => sendInvite(target)}
                    style={styles.inviteBtn}
                  />
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <H2>Stage</H2>
          <View style={styles.stageList}>
            {stagesForPipeline(c.pipeline).map((stage) => {
              const active = stage === c.stage;
              return (
                <Pressable
                  key={stage}
                  onPress={() => setStage(stage)}
                  style={[styles.stageRow, active && styles.stageRowActive]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? palette.gold : palette.textMuted}
                  />
                  <Body style={[styles.stageLabel, active && styles.stageLabelActive]}>
                    {STAGE_LABELS[stage]}
                  </Body>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <H2>Pipeline</H2>
          <Muted style={styles.note}>Currently in {pipelineLabel}.</Muted>
          <Button
            title={`Move to ${otherLabel}`}
            variant="ghost"
            onPress={confirmMove}
            style={styles.moveBtn}
          />
        </Card>

        <Button title="Delete case" variant="danger" onPress={confirmDelete} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.ivory },
  loader: { marginTop: spacing.xxl },
  card: { marginBottom: spacing.lg },
  familyName: { marginTop: spacing.sm },
  metaRow: { marginTop: spacing.md },
  note: { marginTop: spacing.xs },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageList: { marginTop: spacing.sm },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.md,
  },
  stageRowActive: { backgroundColor: palette.ivory },
  stageLabel: { color: palette.text },
  stageLabelActive: { fontWeight: '700', color: palette.navy },
  moveBtn: { marginTop: spacing.md },
  inviteList: { marginTop: spacing.md, gap: spacing.lg },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inviteInfo: { flex: 1, gap: spacing.xs },
  inviteLabel: { fontWeight: '600', fontSize: 16 },
  inviteBtn: { paddingHorizontal: spacing.lg },
});
