/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// The website's palette (liner-notes/app/globals.css): cream paper, ink text,
// coral accent — with a dark counterpart built on the same ink.
export const Accent = '#FF5D73';

export const Colors = {
  light: {
    text: '#27222E',
    background: '#FFF9F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFE9E3',
    textSecondary: '#6F6878',
  },
  dark: {
    text: '#FFF9F1',
    background: '#17131C',
    backgroundElement: '#27222E',
    backgroundSelected: '#3A3344',
    textSecondary: '#A49DAF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// The web shim for native tabs floats its switcher over the top of the page.
export const TopTabInset = Platform.select({ web: 64 }) ?? 0;
export const MaxContentWidth = 800;
