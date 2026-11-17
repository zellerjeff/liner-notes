# Liner Notes — mobile app

The iOS and Android app for [Liner Notes](../README.md): one Expo (React Native) codebase,
with a phone layout and a tablet split-view layout chosen from the live window width.
It is a second client on the website's existing JSON API — no logic is duplicated here.

## Running it

```bash
export PATH="$HOME/.local/node22/bin:$PATH"   # if node isn't on your PATH
cd liner-notes && npm run dev                 # the API, on http://localhost:3000
cd liner-notes/mobile && npx expo start       # then press w (web), i (iOS), a (Android)
```

`.env` points the app at `http://localhost:3000`; EAS builds override it with the production
URL (see `eas.json`). In dev builds the login screen offers **Demo sign-in**, which works
whenever the site's demo mode is on (the local default).

The web target is a development vehicle only — handy for checking layout and data flow
without a simulator. Gestures, the keyboard, audio session behaviour, and native sign-in
need a real build.

## What's where

| Path | What |
| --- | --- |
| `src/app/` | Routes: `(tabs)/` Songs · Albums · My Page, `item/[id]` editor, `import` modal, `login` |
| `src/components/items-screen.tsx` | Phone list vs. tablet split view |
| `src/components/note-editor.tsx` | Autosaving note editor (shared by both layouts) |
| `src/hooks/use-items.ts` | Item store: disk cache, offline note queue, refresh on foreground |
| `src/hooks/use-layout.ts` | `phone` / `tablet` from window width (≥ 700dp is tablet) |
| `src/lib/auth.tsx` | Session: SecureStore token, sign-in exchange, sign-out on 401 |
| `src/lib/api.ts` | Typed client for the site's `/api` routes |
| `assets/src/*.svg` | Icon and splash sources (PNG renders live in `assets/images/`) |

## Before the first device build

These need accounts only the owner can create:

1. **Expo account** — `npx eas-cli@latest login`, then `npx eas-cli@latest init` here to link
   the project.
2. **Google sign-in** — in the Google Cloud console (same project as the website's OAuth
   client) create an **iOS** client ID (bundle `com.linernotes.app`) and an **Android** client
   ID (package `com.linernotes.app` + the SHA-1 EAS prints for your keystore). Then:
   - here, in `.env`: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=…` and
     `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=…` (`app.config.ts` registers the iOS redirect
     scheme automatically);
   - on Vercel: `GOOGLE_MOBILE_CLIENT_IDS=<ios id>,<android id>` so the API accepts their
     ID tokens.
3. **Sign in with Apple** (required by App Store review because Google sign-in is offered)
   — needs the Apple Developer Program. The capability is already declared in `app.json`;
   EAS enables it on the App ID. If the bundle ID ever changes, set `APPLE_APP_BUNDLE_ID`
   on Vercel to match.
4. **Stores** — Apple Developer Program (USD 99/yr) and a Google Play Console account
   (USD 25 once).

## Building

```bash
npx eas-cli@latest build --profile development-simulator --platform ios   # simulator build
npx eas-cli@latest build --profile development --platform all             # dev clients for devices
npx eas-cli@latest build --profile production --platform all              # store builds
npx eas-cli@latest submit --platform all                                  # TestFlight + Play
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Still to verify on a real device

Everything below is implemented but could not be exercised from the web target:

- Long-press drag to reorder (the reorder request itself is verified)
- Native Google and Apple sign-in (the demo flow and token exchange are verified)
- Keyboard avoidance in the note editor, the share sheet, and the in-app browser
- Preview audio with the silent switch, and behaviour when the app backgrounds
- iPad Split View / Slide Over and Android split-screen resizing (verified by resizing the
  web target between 375px and 1024px)
- Swipe-to-delete on list rows is not built; delete lives in the note editor
