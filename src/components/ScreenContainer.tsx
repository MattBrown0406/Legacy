import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { maxContentWidth, palette, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Set when an AppHeader above already consumed the top safe-area inset. */
  underHeader?: boolean;
}

/**
 * Mobile-first content wrapper. Centers content in a max-width (~720) column so
 * the app also reads well on web / iPad.
 */
export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
  underHeader = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const topInset = underHeader ? 0 : insets.top;

  const inner = (
    <View style={[styles.column, contentStyle]}>{children}</View>
  );

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: topInset }]}>
        <View style={styles.center}>{inner}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      <View style={styles.center}>{inner}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ivory,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  center: {
    width: '100%',
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: maxContentWidth,
  },
});
