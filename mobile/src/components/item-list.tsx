import { router } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, StyleSheet, Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortables';

import { ItemCard } from '@/components/item-card';
import { MiniPlayer } from '@/components/mini-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing, TopTabInset } from '@/constants/theme';
import { publishItems, refreshItems, useItems } from '@/hooks/use-items';
import { api } from '@/lib/api';
import type { Item, ItemKind } from '@/lib/types';

const EMPTY_COPY: Record<ItemKind, string> = {
  song: 'No songs yet. Paste a Spotify or Apple Music link to bring in the first ones.',
  album: 'No albums yet. Paste an album link for a record that deserves to be heard front to back.',
};

type ItemListProps = {
  kind: ItemKind;
  /** Tablet split view: select in place instead of pushing the editor screen. */
  onSelect?: (item: Item) => void;
  selectedId?: number;
};

export function ItemList({ kind, onSelect, selectedId }: ItemListProps) {
  const { items, allItems, error, refreshing, refresh } = useItems(kind);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  // Long-press drag reorder: publish the new order instantly, then persist it;
  // on failure re-fetch so the list snaps back to the server's truth.
  const commitReorder = useCallback(
    (ordered: Item[]) => {
      const others = (allItems ?? []).filter((i) => i.kind !== kind);
      publishItems([...others, ...ordered.map((i, pos) => ({ ...i, position: pos }))]);
      api.reorder(kind, ordered.map((i) => i.id)).catch(() => refreshItems());
    },
    [allItems, kind]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemCard
        item={item}
        selected={item.id === selectedId}
        onPress={() => (onSelect ? onSelect(item) : router.push(`/item/${item.id}`))}
      />
    ),
    [onSelect, selectedId]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Animated.ScrollView
          ref={scrollableRef}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => refresh({ spinner: true })} />
          }>
          {items && items.length > 0 ? (
            <Sortable.Grid
              columns={1}
              data={items}
              keyExtractor={(i: Item) => String(i.id)}
              rowGap={Spacing.two}
              scrollableRef={scrollableRef}
              dragActivationDelay={200}
              onDragEnd={({ data }) => commitReorder(data)}
              renderItem={renderItem}
            />
          ) : (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                {error ?? (items === null ? 'Loading…' : EMPTY_COPY[kind])}
              </ThemedText>
            </View>
          )}
        </Animated.ScrollView>

        <View style={styles.overlay} pointerEvents="box-none">
          <MiniPlayer />
          <Pressable
            accessibilityLabel={kind === 'song' ? 'Import songs' : 'Import albums'}
            onPress={() => router.push(`/import?kind=${kind}`)}
            style={styles.fabWrap}>
            <ThemedView type="backgroundSelected" style={styles.fab}>
              <ThemedText type="subtitle" style={styles.fabGlyph}>
                +
              </ThemedText>
            </ThemedView>
          </Pressable>
        </View>
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
  },
  listContent: {
    padding: Spacing.three,
    paddingTop: Spacing.three + TopTabInset,
    paddingBottom: BottomTabInset + 96,
  },
  empty: {
    paddingTop: 120,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BottomTabInset + Spacing.two,
    gap: Spacing.two,
  },
  fabWrap: {
    position: 'absolute',
    right: Spacing.four,
    bottom: 64,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabGlyph: {
    lineHeight: 40,
  },
});
