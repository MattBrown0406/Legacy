import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { KIND_LABELS, listAppointments } from '@/data/appointments';
import { listCases } from '@/data/cases';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge, Body, Card, H1, H2, Muted, SegmentedControl } from '@/components/ui';
import { Appointment } from '@/types';
import { palette, radius, spacing } from '@/theme';

type ViewMode = 'list' | 'day';

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function dayKey(iso: string): string {
  return startOfDay(new Date(iso)).toISOString();
}
function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function dayHeading(d: Date): string {
  const today = startOfDay(new Date());
  const diff = (startOfDay(d).getTime() - today.getTime()) / 86_400_000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
function timeRange(a: Appointment): string {
  const start = new Date(a.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!a.ends_at) return start;
  const end = new Date(a.ends_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${start} – ${end}`;
}

export default function ScheduleScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<ViewMode>('list');
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [caseNames, setCaseNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [day, setDay] = useState<Date>(startOfDay(new Date()));

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [aRows, cRows] = await Promise.all([listAppointments(profile.id), listCases(profile.id)]);
      setAppts(aRows);
      const map: Record<string, string> = {};
      cRows.forEach((c) => (map[c.id] = c.family_name));
      setCaseNames(map);
    } catch (e) {
      console.warn('[Legacy] schedule load failed', e);
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

  function renderAppt(a: Appointment) {
    return (
      <Card key={a.id} style={styles.apptCard} onPress={() => router.push(`/appointment/${a.id}`)}>
        <View style={styles.apptRow}>
          <View style={styles.timeCol}>
            <Body style={styles.time}>
              {new Date(a.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Body>
          </View>
          <View style={styles.apptInfo}>
            <Body style={styles.apptTitle}>{a.title}</Body>
            <View style={styles.metaRow}>
              <Badge label={KIND_LABELS[a.kind]} tone="gold" />
              {a.case_id && caseNames[a.case_id] ? (
                <Muted style={styles.metaText}>{caseNames[a.case_id]}</Muted>
              ) : null}
            </View>
            <Muted style={styles.metaText}>{timeRange(a)}</Muted>
            {a.location ? <Muted style={styles.metaText}>{a.location}</Muted> : null}
          </View>
          {a.reminder_minutes != null ? (
            <Ionicons name="notifications" size={16} color={palette.gold} />
          ) : null}
        </View>
      </Card>
    );
  }

  // List view: today forward, grouped by day.
  const upcoming = appts.filter((a) => new Date(a.starts_at).getTime() >= startOfDay(new Date()).getTime());
  const groups: { key: string; date: Date; items: Appointment[] }[] = [];
  upcoming.forEach((a) => {
    const k = dayKey(a.starts_at);
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = { key: k, date: new Date(a.starts_at), items: [] };
      groups.push(g);
    }
    g.items.push(a);
  });

  const dayAppts = appts.filter((a) => sameDay(new Date(a.starts_at), day));

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
      <View style={styles.titleRow}>
        <H1>Schedule</H1>
        <Pressable style={styles.addBtn} onPress={() => router.push('/appointment/new')} hitSlop={8}>
          <Ionicons name="add" size={24} color={palette.white} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'list', label: 'Upcoming' },
            { value: 'day', label: 'Day' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={palette.navy} style={styles.loader} />
      ) : mode === 'list' ? (
        groups.length === 0 ? (
          <Card>
            <Body>No upcoming appointments.</Body>
            <Muted style={styles.metaText}>Tap + to add one.</Muted>
          </Card>
        ) : (
          groups.map((g) => (
            <View key={g.key} style={styles.group}>
              <H2 style={styles.dayHeading}>{dayHeading(g.date)}</H2>
              {g.items.map(renderAppt)}
            </View>
          ))
        )
      ) : (
        <View>
          <View style={styles.dayNav}>
            <Pressable
              onPress={() => setDay((d) => new Date(d.getTime() - 86_400_000))}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color={palette.navy} />
            </Pressable>
            <H2>{dayHeading(day)}</H2>
            <Pressable
              onPress={() => setDay((d) => new Date(d.getTime() + 86_400_000))}
              hitSlop={10}
            >
              <Ionicons name="chevron-forward" size={24} color={palette.navy} />
            </Pressable>
          </View>
          {dayAppts.length === 0 ? (
            <Card>
              <Body>Nothing scheduled.</Body>
            </Card>
          ) : (
            dayAppts.map(renderAppt)
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: { marginBottom: spacing.xl },
  loader: { marginTop: spacing.xxl },
  group: { marginBottom: spacing.xl },
  dayHeading: { marginBottom: spacing.md },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  apptCard: { marginBottom: spacing.md },
  apptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  timeCol: { width: 64 },
  time: { fontWeight: '700', color: palette.navy },
  apptInfo: { flex: 1 },
  apptTitle: { fontWeight: '600', fontSize: 16, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  metaText: { marginTop: 2 },
});
