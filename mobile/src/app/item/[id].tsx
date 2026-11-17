import { router, Stack, useLocalSearchParams } from 'expo-router';

import { NoteEditor } from '@/components/note-editor';
import { ThemedView } from '@/components/themed-view';
import { useItems } from '@/hooks/use-items';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const { allItems } = useItems('song');
  const title = allItems?.find((i) => i.id === itemId)?.title;

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: title ?? 'Note' }} />
      <NoteEditor itemId={itemId} onDeleted={() => router.back()} />
    </ThemedView>
  );
}
