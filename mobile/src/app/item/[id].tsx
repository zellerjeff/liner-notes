import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';

// Phase 4 turns this into the full note editor with autosave.
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allItems } = useItems('song');
  const item = allItems?.find((i) => i.id === Number(id));

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{item?.title ?? '…'}</ThemedText>
      {!!item?.artist && (
        <ThemedText type="small" themeColor="textSecondary">
          {item.artist}
        </ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        The note editor lands here in phase 4.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
