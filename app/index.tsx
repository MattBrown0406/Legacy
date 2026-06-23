import { Redirect } from 'expo-router';

// The auth gate in _layout.tsx redirects to /sign-in or /profile-setup as needed.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
