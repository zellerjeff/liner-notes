import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { publishItems } from '@/hooks/use-items';
import { api, ApiError } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

const LINK_PATTERN = /(open\.spotify\.com|music\.apple\.com|spotify\.link)\//i;

export default function ImportScreen() {
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind = kindParam === 'album' ? 'album' : 'song';
  const theme = useTheme();

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Offer a music link already on the clipboard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS === 'web') return; // web clipboard reads need a permission prompt
        const text = await Clipboard.getStringAsync();
        if (!cancelled && text && LINK_PATTERN.test(text)) setUrl(text.trim());
      } catch {
        // no clipboard access — the field just starts empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runImport = async () => {
    const link = url.trim();
    if (!link) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.importLink(link, kind);
      publishItems(result.items);
      setDone(
        result.added === 0
          ? 'Nothing new — those are already on your list.'
          : `Added ${result.added}${result.skipped ? ` (${result.skipped} already there)` : ''}.`
      );
      setTimeout(() => router.back(), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed. Check the link and try again.');
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">
        {kind === 'song' ? 'Paste a song or playlist link' : 'Paste an album link'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Spotify and Apple Music links work — title, artist, artwork, and previews come along.
      </ThemedText>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://open.spotify.com/…"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="url"
        editable={!busy && !done}
        onSubmitEditing={runImport}
      />
      {done ? (
        <ThemedText type="smallBold">{done}</ThemedText>
      ) : busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator />
          <ThemedText type="small" themeColor="textSecondary">
            Importing — big playlists can take a moment…
          </ThemedText>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={runImport} disabled={!url.trim()}>
          <ThemedView type="backgroundElement" style={styles.button}>
            <ThemedText type="smallBold">Import</ThemedText>
          </ThemedView>
        </Pressable>
      )}
      {!!error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  error: {
    color: '#d33',
  },
});
