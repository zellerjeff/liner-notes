import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IDS = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

const googleConfigured = !!(
  (Platform.OS === 'ios' && GOOGLE_IDS.iosClientId) ||
  (Platform.OS === 'android' && GOOGLE_IDS.androidClientId) ||
  (Platform.OS === 'web' && GOOGLE_IDS.webClientId)
);

// The Google hook throws if its client ID for the current platform is missing,
// so it must live in a component that only mounts when configured.
function GoogleButton({
  onBusy,
  onError,
}: {
  onBusy: (b: boolean) => void;
  onError: (msg: string | null) => void;
}) {
  const { completeSignIn } = useAuth();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_IDS);

  const signInGoogle = async () => {
    onError(null);
    const result = await promptAsync();
    if (result?.type !== 'success') return;
    const idToken = result.params.id_token;
    if (!idToken) {
      onError('Google sign-in returned no ID token.');
      return;
    }
    onBusy(true);
    try {
      await completeSignIn('google', idToken);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Sign-in failed. Try again.');
      onBusy(false);
    }
  };

  return (
    <Pressable accessibilityRole="button" disabled={!request} onPress={signInGoogle}>
      <ThemedView type="backgroundElement" style={styles.button}>
        <ThemedText type="smallBold">Continue with Google</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { completeSignIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoName, setDemoName] = useState('');
  const theme = useTheme();

  const signInApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token.');
      const name = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      setBusy(true);
      await completeSignIn('apple', credential.identityToken, name || undefined);
    } catch (err) {
      if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
      setError(err instanceof ApiError ? err.message : 'Apple sign-in failed. Try again.');
      setBusy(false);
    }
  };

  const signInDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeSignIn('demo', '', demoName.trim() || 'Demo Listener');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Try again.');
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ThemedText type="subtitle" style={styles.title}>
            Liner Notes.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
            The soundtrack of your life, in your own words.
          </ThemedText>
        </View>

        {busy ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.buttons}>
            {googleConfigured && <GoogleButton onBusy={setBusy} onError={setError} />}

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={signInApple}
              />
            )}

            {__DEV__ && (
              <View style={styles.demo}>
                <TextInput
                  value={demoName}
                  onChangeText={setDemoName}
                  placeholder="Your name (demo)"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.demoInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  autoCapitalize="words"
                  onSubmitEditing={signInDemo}
                />
                <Pressable accessibilityRole="button" onPress={signInDemo}>
                  <ThemedView type="backgroundElement" style={styles.button}>
                    <ThemedText type="smallBold">Demo sign-in</ThemedText>
                  </ThemedView>
                </Pressable>
              </View>
            )}

            {!!error && (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Pressable
              accessibilityRole="link"
              onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/privacy`)}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
                Privacy policy
              </ThemedText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
  buttons: {
    gap: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  appleButton: {
    height: 48,
    width: '100%',
  },
  demo: {
    gap: Spacing.two,
  },
  demoInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#d33',
    textAlign: 'center',
  },
});
