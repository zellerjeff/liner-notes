import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Item } from '@/lib/types';

export function ItemCard({ item, onPress }: { item: Item; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          type={pressed ? 'backgroundSelected' : 'backgroundElement'}
          style={styles.card}>
          {item.artwork_url ? (
            <Image source={{ uri: item.artwork_url }} style={styles.artwork} transition={100} />
          ) : (
            <ThemedView type="backgroundSelected" style={styles.artwork} />
          )}
          <View style={styles.text}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {item.title}
            </ThemedText>
            {!!item.artist && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.artist}
              </ThemedText>
            )}
            <ThemedText
              type="small"
              themeColor={item.note ? 'text' : 'textSecondary'}
              numberOfLines={1}
              style={styles.note}>
              {item.note || 'Add the story…'}
            </ThemedText>
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  note: {
    fontStyle: 'italic',
  },
});
