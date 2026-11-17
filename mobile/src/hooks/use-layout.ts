import { useWindowDimensions } from 'react-native';

export const TABLET_MIN_WIDTH = 700;

/**
 * Which layout the current *window* gets. Decided from live width, never the
 * device model: iPad Split View and Android split-screen can shrink a tablet
 * app to phone width at any moment, and the layout must follow.
 */
export function useLayout(): 'phone' | 'tablet' {
  const { width } = useWindowDimensions();
  return width >= TABLET_MIN_WIDTH ? 'tablet' : 'phone';
}
