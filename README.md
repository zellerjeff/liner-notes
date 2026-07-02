# Liner Notes.

**The soundtrack of your life, in your own words.**

Liner Notes is a "music living will": import the songs and albums that made you who you are
from Spotify or Apple Music, write the story behind each one, and share a single page with
the people who matter.

- **My Songs** — paste a playlist (or individual song) link and every track comes in with
  title, artist, artwork, and a 30-second preview where available.
- **My Albums** — paste album links for the records that deserve to be heard front to back.
- **Notes** — every song and album gets a free-text note: the memory, the person, the moment.
- **Sharing** — you get one clean link (`/w/your-name`) anyone can view, no account needed.
  You can rename the link or flip the page to private at any time.

## Running it

Requires Node 18+ (Node 22 is installed at `~/.local/node22` on this machine).

```bash
export PATH="$HOME/.local/node22/bin:$PATH"   # if node isn't on your PATH
cd liner-notes
npm install
npm run dev
```

Open http://localhost:3000. Out of the box, **demo mode** is enabled: sign in with just a
name (accounts are stored locally in `data/linernotes.db`). No API keys are needed for
importing — Spotify and Apple Music metadata is read from their public pages.

## Enabling Google sign-in (~2 minutes)

1. Go to https://console.cloud.google.com/apis/credentials and create a project (or pick one).
2. **Create Credentials → OAuth client ID → Web application.**
3. Add an authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google` (for local use)
   - `https://your-domain.com/api/auth/callback/google` (when deployed)
4. Put the client ID and secret in `.env.local`:

```
AUTH_GOOGLE_ID=xxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxxxx
ALLOW_DEMO_LOGIN=0   # optional: turn off name-only demo accounts
```

5. Restart the dev server. A "Continue with Google" button appears on the sign-in page.

## Optional: official Spotify API

Playlist import works without any keys by reading Spotify's public embed pages (roughly the
first 100 tracks of a playlist, artwork included). If you want album names on every track and
support for very large playlists, create a free app at
https://developer.spotify.com/dashboard and set:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

The importer automatically prefers the official API when keys are present and falls back to
the public pages if not.

## How it's built

- **Next.js 16** (App Router) + **Tailwind CSS 4**, TypeScript throughout.
- **Auth.js (next-auth v5)** — Google OAuth and/or local demo credentials, JWT sessions.
- **SQLite via libSQL** (`@libsql/client`) — locally it's a plain file at
  `data/linernotes.db` (delete it to reset everything); in production it talks to a free
  hosted Turso database, so it also runs on serverless hosts like Vercel.
- **Importers** (`lib/importers.ts`):
  - Spotify: official Web API when keys are set, otherwise the public embed JSON
    (`open.spotify.com/embed/...`) plus per-track oEmbed for artwork.
  - Apple Music: playlist pages' embedded server data plus the public iTunes Lookup API
    for albums, songs, previews, and artwork enrichment.
- Notes autosave as you type; reordering is done with the ↑/↓ controls on each card.

## Deploying (Vercel + GitHub + Turso — all free tiers)

1. **Push to GitHub.** The repo lives at the `liner-notes` folder root.
2. **Create a Turso database** at https://app.turso.tech (free tier):
   create a database, then copy its **URL** (`libsql://…`) and create an **auth token**.
3. **Import the repo in Vercel** (https://vercel.com/new), and set these environment
   variables in the project settings:
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from the Google console (see above)
   - `TURSO_DATABASE_URL` — the `libsql://…` URL
   - `TURSO_AUTH_TOKEN` — the token
   - (leave `ALLOW_DEMO_LOGIN` unset in production — demo mode lets anyone sign in as any name)
4. **Add the production callback URL** in the Google console:
   `https://your-app.vercel.app/api/auth/callback/google`.
5. Deploy. Tables are created automatically on first use; every push to the default
   branch redeploys.

Prefer a classic server (Railway, Fly.io, Render, a VPS)? It works there too with no
Turso account — leave `TURSO_DATABASE_URL` unset and mount a persistent disk at `data/`.
