import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '@/lib/player';
import type { Item } from '@/lib/types';

// The artwork (play/pause) and the text (open the note) are sibling controls:
// nesting one button inside the other hides the inner one from screen readers.
function Artwork({ item, onOpen }: { item: Item; onOpen?: () => void }) {
  const { nowPlaying, playing, playItem } = usePlayer();
  const isCurrent = nowPlaying?.id === item.id;

  const art = item.artwork_url ? (
    <Image source={{ uri: item.artwork_url }} style={styles.artwork} transition={100} />
  ) : (
    <ThemedView type="background" style={styles.artwork} />
  );

  if (!item.preview_url) {
    // No preview: the artwork is just more of the card's tap target.
    return (
      <Pressable onPress={onOpen} accessible={false}>
        {art}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => playItem(item)}
      accessibilityRole="button"
      accessibilityLabel={
        isCurrent && playing ? `Pause preview of ${item.title}` : `Play preview of ${item.title}`
      }
      hitSlop={6}>
      <View>
        {art}
        <View style={styles.playBadge}>
          <ThemedText style={styles.playGlyph}>{isCurrent && playing ? '❚❚' : '▶'}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

export function ItemCard({
  item,
  onPress,
  selected,
}: {
  item: Item;
  onPress?: () => void;
  selected?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <ThemedView
      type={pressed || selected ? 'backgroundSelected' : 'backgroundElement'}
      style={styles.card}>
      <Artwork item={item} onOpen={onPress} />
      <Pressable
        style={styles.text}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={[item.title, item.artist, item.note ? 'has a note' : 'no note yet']
          .filter(Boolean)
          .join(', ')}
        accessibilityHint="Opens the note. Hold and drag to reorder."
        accessibilityState={{ selected: !!selected }}>
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
      </Pressable>
    </ThemedView>
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
  playBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 11,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  note: {
    fontStyle: 'italic',
  },
});
