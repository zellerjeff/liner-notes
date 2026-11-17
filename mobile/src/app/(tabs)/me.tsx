import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmDestructive } from '@/lib/confirm';
import type { User } from '@/lib/types';

const SHARE_HOST = API_URL.replace(/^https?:\/\//, '');

function ProfileForm({ user }: { user: User }) {
  const { setUser, signOut } = useAuth();
  const theme = useTheme();

  const [pageTitle, setPageTitle] = useState(user.page_title ?? '');
  const [intro, setIntro] = useState(user.intro ?? '');
  const [slug, setSlug] = useState(user.slug);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const dirty =
    pageTitle !== (user.page_title ?? '') || intro !== (user.intro ?? '') || slug !== user.slug;
  const shareUrl = `${API_URL}/w/${user.slug}`;
  const isPublic = user.is_public === 1;
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { user: updated } = await api.updateProfile({
        ...(pageTitle !== (user.page_title ?? '') ? { page_title: pageTitle } : {}),
        ...(intro !== (user.intro ?? '') ? { intro } : {}),
        ...(slug !== user.slug ? { slug } : {}),
      });
      setUser(updated);
      setSlug(updated.slug);
      setMessage({ kind: 'ok', text: 'Saved.' });
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Could not save. Try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async (next: boolean) => {
    setUser({ ...user, is_public: next ? 1 : 0 });
    try {
      const { user: updated } = await api.updateProfile({ is_public: next });
      setUser(updated);
    } catch {
      setUser(user);
      setMessage({ kind: 'error', text: 'Could not change visibility. Try again.' });
    }
  };

  const share = async () => {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(shareUrl);
      setMessage({ kind: 'ok', text: 'Link copied.' });
      return;
    }
    await Share.share(Platform.OS === 'ios' ? { url: shareUrl } : { message: shareUrl });
  };

  const deleteAccount = () => {
    confirmDestructive(
      'Delete your account?',
      'Your page, every song and album, and all of your notes will be permanently deleted. This cannot be undone.',
      'Delete account',
      async () => {
        try {
          await api.deleteAccount();
          await signOut();
        } catch {
          setMessage({ kind: 'error', text: 'Could not delete the account. Try again.' });
        }
      }
    );
  };

  return (
    <>
      <View style={styles.section}>
        <ThemedText type="subtitle">My Page</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Signed in as {user.name ?? user.email}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Your link</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" selectable>
          {SHARE_HOST}/w/{user.slug}
        </ThemedText>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={share} style={styles.flex}>
            <ThemedView type="backgroundSelected" style={styles.button}>
              <ThemedText type="smallBold">{Platform.OS === 'web' ? 'Copy link' : 'Share'}</ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => WebBrowser.openBrowserAsync(shareUrl)} style={styles.flex}>
            <ThemedView type="backgroundSelected" style={styles.button}>
              <ThemedText type="smallBold">View page</ThemedText>
            </ThemedView>
          </Pressable>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Public</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {isPublic ? 'Anyone with the link can view.' : 'Only you can see your page.'}
            </ThemedText>
          </View>
          <Switch value={isPublic} onValueChange={togglePublic} accessibilityLabel="Page is public" />
        </View>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Page details</ThemedText>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Title
          </ThemedText>
          <TextInput
            value={pageTitle}
            onChangeText={setPageTitle}
            placeholder="The soundtrack of my life"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
            maxLength={120}
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Intro
          </ThemedText>
          <TextInput
            value={intro}
            onChangeText={setIntro}
            placeholder="A few words for the people you share this with…"
            placeholderTextColor={theme.textSecondary}
            style={[inputStyle, styles.multiline]}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Link name
          </ThemedText>
          <TextInput
            value={slug}
            onChangeText={(t) => setSlug(t.toLowerCase())}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={40}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={save} disabled={!dirty || saving}>
          <ThemedView
            type="backgroundSelected"
            style={[styles.button, (!dirty || saving) && styles.disabled]}>
            <ThemedText type="smallBold">{saving ? 'Saving…' : 'Save changes'}</ThemedText>
          </ThemedView>
        </Pressable>
        {!!message && (
          <ThemedText type="small" style={message.kind === 'error' ? styles.error : undefined}>
            {message.text}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.card}>
        <Pressable accessibilityRole="button" onPress={signOut}>
          <ThemedView type="backgroundSelected" style={styles.button}>
            <ThemedText type="smallBold">Sign out</ThemedText>
          </ThemedView>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={deleteAccount} style={styles.deleteRow}>
          <ThemedText type="small" style={styles.error}>
            Delete account
          </ThemedText>
        </Pressable>
      </ThemedView>
    </>
  );
}

export default function MyPageScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.column}>
              {user ? (
                // Remount when the account changes so the form re-seeds its fields.
                <ProfileForm key={user.id} user={user} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Loading profile…
                </ThemedText>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingTop: Spacing.three + TopTabInset,
    paddingBottom: BottomTabInset + Spacing.four,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 560,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two / 2,
    paddingHorizontal: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two / 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  deleteRow: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  error: {
    color: '#d33',
  },
});
