import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json. Native Google sign-in on iOS redirects back through the
// client ID's reversed form as a URL scheme, so register it whenever the ID is
// configured instead of hand-editing app.json.
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleScheme = iosClientId ? iosClientId.split('.').reverse().join('.') : null;

  return {
    ...config,
    name: config.name ?? 'Liner Notes',
    slug: config.slug ?? 'liner-notes',
    scheme: googleScheme ? ['linernotes', googleScheme] : 'linernotes',
  };
};
