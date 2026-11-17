import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '@/lib/player';

/** Bar shown above the tab bar while a 30-second preview plays. */
export function MiniPlayer() {
  const { nowPlaying, playing, playItem, stop } = usePlayer();
  if (!nowPlaying) return null;

  return (
    <ThemedView type="backgroundSelected" style={styles.bar}>
      <Pressable
        onPress={() => playItem(nowPlaying)}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        hitSlop={8}>
        <ThemedText type="smallBold" style={styles.glyph}>
          {playing ? '❚❚' : '▶'}
        </ThemedText>
      </Pressable>
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {nowPlaying.title}
        </ThemedText>
        {!!nowPlaying.artist && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {nowPlaying.artist}
          </ThemedText>
        )}
      </View>
      <Pressable
        onPress={stop}
        accessibilityRole="button"
        accessibilityLabel="Close player"
        hitSlop={8}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.glyph}>
          ✕
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    marginHorizontal: Spacing.three,
  },
  glyph: {
    width: 24,
    textAlign: 'center',
  },
  text: {
    flex: 1,
  },
});
