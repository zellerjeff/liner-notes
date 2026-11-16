import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Item } from '@/lib/types';

// One shared preview player: starting a new preview stops the old one, and the
// mini-player bar reflects whatever is playing from any screen.

type PlayerContextValue = {
  nowPlaying: Item | null;
  playing: boolean;
  /** Play this item's preview; tapping the playing item toggles pause. */
  playItem: (item: Item) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [nowPlaying, setNowPlaying] = useState<Item | null>(null);

  const playItem = useCallback(
    (item: Item) => {
      if (!item.preview_url) return;
      if (nowPlaying?.id === item.id) {
        if (status.playing) player.pause();
        else player.play();
        return;
      }
      player.replace({ uri: item.preview_url });
      player.play();
      setNowPlaying(item);
    },
    [nowPlaying, player, status.playing]
  );

  const stop = useCallback(() => {
    player.pause();
    setNowPlaying(null);
  }, [player]);

  const value = useMemo(
    () => ({ nowPlaying, playing: status.playing, playItem, stop }),
    [nowPlaying, status.playing, playItem, stop]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
