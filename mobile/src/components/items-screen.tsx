import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemList } from '@/components/item-list';
import { NoteEditor } from '@/components/note-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, TopTabInset } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import type { ItemKind } from '@/lib/types';

/**
 * Songs / Albums screen. Phones get the list (cards push the editor screen);
 * tablets get a split view with the note editor always open beside the list.
 */
export function ItemsScreen({ kind }: { kind: ItemKind }) {
  const layout = useLayout();
  const theme = useTheme();
  const { items } = useItems(kind);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (layout === 'phone') return <ItemList kind={kind} />;

  // Writing is the point of the app, so the pane is never empty while the
  // list has anything in it: fall back to the first item.
  const selected = items?.find((i) => i.id === selectedId) ?? items?.[0] ?? null;

  return (
    <ThemedView style={styles.split}>
      <View style={styles.listPane}>
        <ItemList
          kind={kind}
          selectedId={selected?.id}
          onSelect={(item) => setSelectedId(item.id)}
        />
      </View>
      <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
      <SafeAreaView style={styles.editorPane} edges={['top', 'right']}>
        {selected ? (
          <NoteEditor itemId={selected.id} onDeleted={() => setSelectedId(null)} />
        ) : (
          <View style={styles.placeholder}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderText}>
              {kind === 'song'
                ? 'Import a song, then write its story here.'
                : 'Import an album, then write its story here.'}
            </ThemedText>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  listPane: {
    width: '42%',
    minWidth: 300,
    maxWidth: 400,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
  },
  editorPane: {
    flex: 1,
    paddingTop: TopTabInset,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
