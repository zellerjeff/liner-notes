import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { patchItem, removeItem, useItems } from '@/hooks/use-items';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { usePlayer } from '@/lib/player';

const AUTOSAVE_MS = 800;

function confirmDelete(title: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // Alert.alert is a no-op on react-native-web
    if (typeof window !== 'undefined' && window.confirm(`Remove “${title}” from your list?`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert('Remove from your list?', `“${title}” and its note will be deleted.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const { allItems } = useItems('song');
  const item = allItems?.find((i) => i.id === itemId);
  const theme = useTheme();
  const { nowPlaying, playing, playItem } = usePlayer();

  const [note, setNote] = useState(item?.note ?? '');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const lastSaved = useRef(item?.note ?? '');
  const loaded = useRef(!!item);

  // The list may still be loading on a cold start straight into this screen.
  useEffect(() => {
    if (item && !loaded.current) {
      loaded.current = true;
      setNote(item.note);
      lastSaved.current = item.note;
    }
  }, [item]);

  // Debounced autosave, like the site.
  useEffect(() => {
    if (note === lastSaved.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        await api.updateNote(itemId, note);
        lastSaved.current = note;
        patchItem(itemId, { note });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [note, itemId]);

  const onDelete = () => {
    if (!item) return;
    confirmDelete(item.title, async () => {
      try {
        await api.deleteItem(itemId);
        removeItem(itemId);
        router.back();
      } catch {
        setSaveState('error');
      }
    });
  };

  const isCurrent = nowPlaying?.id === itemId;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: item?.title ?? 'Note' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            {item?.artwork_url ? (
              <Image source={{ uri: item.artwork_url }} style={styles.artwork} transition={150} />
            ) : (
              <ThemedView type="backgroundElement" style={styles.artwork} />
            )}
            <View style={styles.headerText}>
              <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
                {item?.title ?? '…'}
              </ThemedText>
              {!!item?.artist && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {item.artist}
                </ThemedText>
              )}
              {!!item?.preview_url && (
                <Pressable onPress={() => item && playItem(item)}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {isCurrent && playing ? '❚❚ Pause preview' : '▶ Play 30-second preview'}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="The memory, the person, the moment…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.note, { color: theme.text, borderColor: theme.backgroundSelected }]}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {saveState === 'saving'
                ? 'Saving…'
                : saveState === 'error'
                  ? 'Could not save — check your connection.'
                  : 'Saved'}
            </ThemedText>
            <Pressable onPress={onDelete}>
              <ThemedText type="small" style={styles.delete}>
                Remove from list
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  artwork: {
    width: 96,
    height: 96,
    borderRadius: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: Spacing.two / 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  note: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 220,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delete: {
    color: '#d33',
  },
});
