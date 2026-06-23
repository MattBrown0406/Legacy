import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Lighthouse } from '@/components/Lighthouse';
import { Body, Button, Field, H1, Muted } from '@/components/ui';
import { palette, serifFont, spacing } from '@/theme';

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  async function submitEmail() {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase not configured',
        'Paste your Legacy Supabase URL and anon key into .env, then restart.',
      );
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert(
          'Check your email',
          'If email confirmation is on, confirm your address, then sign in.',
        );
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token from Apple.');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign in failed', e?.message ?? 'Unknown error');
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.markWrap}>
          <Lighthouse size={88} />
        </View>
        <H1 style={styles.title}>Legacy</H1>
        <Muted style={styles.tagline}>Practice management for interventionists</Muted>
      </View>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@practice.com"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        placeholder="••••••••"
      />

      <Button
        title={mode === 'signin' ? 'Sign in' : 'Create account'}
        onPress={submitEmail}
        loading={busy}
      />

      <Button
        title={mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        variant="ghost"
        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        style={styles.switchBtn}
      />

      {Platform.OS === 'ios' && appleAvailable ? (
        <View style={styles.appleWrap}>
          <Body style={styles.or}>or</Body>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleBtn}
            onPress={signInWithApple}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  markWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 40, fontFamily: serifFont },
  tagline: { marginTop: spacing.xs },
  switchBtn: { marginTop: spacing.sm, borderColor: 'transparent' },
  appleWrap: { marginTop: spacing.lg, alignItems: 'center' },
  or: { color: palette.textMuted, marginBottom: spacing.md },
  appleBtn: { width: '100%', height: 50 },
});
