import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/item-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import type { ItemKind } from '@/lib/types';

const EMPTY_COPY: Record<ItemKind, string> = {
  song: 'No songs yet. Paste a Spotify or Apple Music link to bring in the first ones.',
  album: 'No albums yet. Paste an album link for a record that deserves to be heard front to back.',
};

export function ItemList({ kind }: { kind: ItemKind }) {
  const { items, error, refreshing, refresh } = useItems(kind);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => refresh({ spinner: true })} />
          }
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                {error ?? (items === null ? 'Loading…' : EMPTY_COPY[kind])}
              </ThemedText>
            </View>
          }
        />
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
    paddingBottom: BottomTabInset + Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
  empty: {
    paddingTop: 120,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
