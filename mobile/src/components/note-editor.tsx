import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
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
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { confirmDestructive } from '@/lib/confirm';
import { usePlayer } from '@/lib/player';
import type { Item } from '@/lib/types';

const AUTOSAVE_MS = 800;
const RETRY_MS = 5000;

function EditorBody({ item, onDeleted }: { item: Item; onDeleted?: () => void }) {
  const theme = useTheme();
  const { nowPlaying, playing, playItem } = usePlayer();

  const [note, setNote] = useState(item.note);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [retry, setRetry] = useState(0);
  const lastSaved = useRef(item.note);
  const latest = useRef(item.note);
  const deleted = useRef(false);

  const onChangeNote = (text: string) => {
    latest.current = text;
    setNote(text);
    setSaveState(text === lastSaved.current ? 'saved' : 'saving');
  };

  // Debounced autosave, like the site; a failed save retries until it lands.
  useEffect(() => {
    if (note === lastSaved.current) return;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const saveTimer = setTimeout(async () => {
      try {
        await api.updateNote(item.id, note);
        lastSaved.current = note;
        patchItem(item.id, { note });
        setSaveState(latest.current === note ? 'saved' : 'saving');
      } catch {
        setSaveState('error');
        retryTimer = setTimeout(() => setRetry((r) => r + 1), RETRY_MS);
      }
    }, AUTOSAVE_MS);
    return () => {
      clearTimeout(saveTimer);
      clearTimeout(retryTimer);
    };
  }, [note, item.id, retry]);

  // Leaving mid-debounce must not drop the last keystrokes.
  useEffect(() => {
    const id = item.id;
    return () => {
      const pending = latest.current;
      if (deleted.current || pending === lastSaved.current) return;
      api
        .updateNote(id, pending)
        .then(() => patchItem(id, { note: pending }))
        .catch(() => {});
    };
  }, [item.id]);

  const onDelete = () => {
    confirmDestructive(
      'Remove from your list?',
      `“${item.title}” and its note will be deleted.`,
      'Delete',
      async () => {
        try {
          await api.deleteItem(item.id);
          deleted.current = true;
          removeItem(item.id);
          onDeleted?.();
        } catch {
          setSaveState('error');
        }
      }
    );
  };

  const isCurrent = nowPlaying?.id === item.id;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {item.artwork_url ? (
            <Image source={{ uri: item.artwork_url }} style={styles.artwork} transition={150} />
          ) : (
            <ThemedView type="backgroundElement" style={styles.artwork} />
          )}
          <View style={styles.headerText}>
            <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
              {item.title}
            </ThemedText>
            {!!item.artist && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.artist}
              </ThemedText>
            )}
            {!!item.preview_url && (
              <Pressable onPress={() => playItem(item)}>
                <ThemedText type="small" themeColor="textSecondary">
                  {isCurrent && playing ? '❚❚ Pause preview' : '▶ Play 30-second preview'}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="The memory, the person, the moment…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.note, { color: theme.text, borderColor: theme.backgroundSelected }]}
          multiline
          textAlignVertical="top"
          accessibilityLabel={`Note for ${item.title}`}
        />

        <View style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary">
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'error'
                ? 'Not saved yet — will retry.'
                : 'Saved'}
          </ThemedText>
          <Pressable onPress={onDelete} hitSlop={8}>
            <ThemedText type="small" style={styles.delete}>
              Remove from list
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** The note editor for one item — a full screen on phones, the right pane on tablets. */
export function NoteEditor({ itemId, onDeleted }: { itemId: number; onDeleted?: () => void }) {
  const { allItems } = useItems('song');
  const item = allItems?.find((i) => i.id === itemId);

  if (!item) {
    return (
      <View style={styles.placeholder}>
        <ThemedText type="small" themeColor="textSecondary">
          {allItems === null ? 'Loading…' : 'This item is no longer on your list.'}
        </ThemedText>
      </View>
    );
  }

  // Keyed so switching items (tablet pane) re-seeds the editor's state.
  return <EditorBody key={item.id} item={item} onDeleted={onDeleted} />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
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
