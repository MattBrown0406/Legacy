import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { palette, radius, serifFont, spacing } from '@/theme';

/* ---------- Typography ---------- */

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/* ---------- Card ---------- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && styles.btnPressed,
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.btnText, { color: v.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: palette.navy, fg: palette.white, border: palette.navy },
  secondary: { bg: palette.gold, fg: palette.navyDeep, border: palette.gold },
  ghost: { bg: 'transparent', fg: palette.navy, border: palette.line },
  danger: { bg: 'transparent', fg: palette.danger, border: palette.danger },
};

/* ---------- Field ---------- */

export function Field({
  label,
  ...props
}: { label?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

/* ---------- Badge ---------- */

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'gold' | 'success' | 'navy';
}) {
  const tones = {
    neutral: { bg: palette.ivoryDeep, fg: palette.text },
    gold: { bg: '#F6E6C8', fg: palette.goldDeep },
    success: { bg: '#D9EDE2', fg: palette.success },
    navy: { bg: palette.navy, fg: palette.white },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ---------- Divider ---------- */

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  h1: { fontFamily: serifFont, fontSize: 28, color: palette.navy, fontWeight: '700' },
  h2: { fontFamily: serifFont, fontSize: 20, color: palette.navy, fontWeight: '600' },
  body: { fontSize: 16, color: palette.text, lineHeight: 22 },
  muted: { fontSize: 14, color: palette.textMuted, lineHeight: 20 },
  label: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    padding: spacing.lg,
  },
  cardPressed: { opacity: 0.85 },
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '600' },
  field: { marginBottom: spacing.lg },
  input: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: palette.text,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: palette.lineSoft, marginVertical: spacing.lg },
});
