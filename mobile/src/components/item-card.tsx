import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '@/lib/player';
import type { Item } from '@/lib/types';

function Artwork({ item }: { item: Item }) {
  const { nowPlaying, playing, playItem } = usePlayer();
  const isCurrent = nowPlaying?.id === item.id;

  const art = item.artwork_url ? (
    <Image source={{ uri: item.artwork_url }} style={styles.artwork} transition={100} />
  ) : (
    <ThemedView type="backgroundSelected" style={styles.artwork} />
  );

  if (!item.preview_url) return art;

  return (
    <Pressable
      onPress={() => playItem(item)}
      accessibilityLabel={isCurrent && playing ? 'Pause preview' : 'Play preview'}
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

export function ItemCard({ item, onPress }: { item: Item; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          type={pressed ? 'backgroundSelected' : 'backgroundElement'}
          style={styles.card}>
          <Artwork item={item} />
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
