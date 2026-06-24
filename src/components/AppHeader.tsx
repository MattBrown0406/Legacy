import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, serifFont, spacing } from '@/theme';

/**
 * Simple top bar with optional back button for stack (non-tab) screens.
 */
export function AppHeader({
  title,
  back = true,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {back ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={palette.white} />
          </Pressable>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: palette.navy,
  },
  side: { width: 44, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: palette.white,
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: '600',
  },
});
