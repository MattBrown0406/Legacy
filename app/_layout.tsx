import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { palette } from '@/theme';

function RootNavigator() {
  const { initializing, session, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const first = segments[0];
    const inAuthGroup = first === 'sign-in';
    const inProfileSetup = first === 'profile-setup';

    if (!session) {
      if (!inAuthGroup) router.replace('/sign-in');
      return;
    }

    // Signed in but no practitioner profile yet -> force setup.
    if (!profile) {
      if (!inProfileSetup) router.replace('/profile-setup');
      return;
    }

    // Signed in with a profile -> keep out of auth/setup screens.
    if (inAuthGroup || inProfileSetup) {
      router.replace('/(tabs)');
    }
  }, [initializing, session, profile, segments, router]);

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={palette.gold} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ivory } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
