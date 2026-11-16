import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

// Phase 5 fills this in: share link, rename, public/private, delete account.
export default function MyPageScreen() {
  const { user, signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedText type="subtitle">My Page</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user ? `Signed in as ${user.name ?? user.email}` : 'Loading profile…'}
        </ThemedText>
        <Pressable onPress={signOut}>
          <ThemedView type="backgroundElement" style={styles.button}>
            <ThemedText type="smallBold">Sign out</ThemedText>
          </ThemedView>
        </Pressable>
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
});
