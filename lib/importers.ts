import type { NewItem, ItemKind } from "./db";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export class ImportError extends Error {}

export type ImportResult = {
  items: NewItem[];
  collection?: string;
};

/**
 * Import songs or albums from a Spotify / Apple Music share link.
 * `target` is which section the user is importing into.
 */
export async function importLink(rawUrl: string, target: ItemKind): Promise<ImportResult> {
  const url = (rawUrl || "").trim();
  if (!url) throw new ImportError("Paste a link first.");

  const spotify = url.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track)\/([A-Za-z0-9]+)/i
  );
  if (spotify) {
    const [, type, id] = spotify;
    return importSpotify(type.toLowerCase(), id, target);
  }

  const apple = url.match(/music\.apple\.com\/([a-z]{2})\/(playlist|album|song)\/[^/]+\/([^/?#]+)/i);
  if (apple) {
    const [, storefront, type, id] = apple;
    const songId = url.match(/[?&]i=(\d+)/)?.[1];
    return importApple(type.toLowerCase(), id, storefront.toLowerCase(), songId, target);
  }

  if (/spotify|apple/i.test(url)) {
    throw new ImportError(
      "I couldn't read that link. Use a share link like open.spotify.com/playlist/… or music.apple.com/…/album/…"
    );
  }
  throw new ImportError("That doesn't look like a Spotify or Apple Music link.");
}

function wrongSection(linkIs: string, belongsIn: string): ImportError {
  return new ImportError(`That's ${linkIs} link — paste it into the ${belongsIn} section instead.`);
}

/* ------------------------------ Spotify ------------------------------ */

async function importSpotify(type: string, id: string, target: ItemKind): Promise<ImportResult> {
  if (target === "song" && type === "album") throw wrongSection("an album", "My Albums");
  if (target === "album" && type !== "album")
    throw new ImportError("The My Albums section takes album links. For playlists and songs, use My Songs.");

  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      return await importSpotifyApi(type, id, target);
    } catch {
      // fall through to the public embed
    }
  }
  return importSpotifyEmbed(type, id, target);
}

/* Public embed page — no API keys required. */

type EmbedTrack = {
  uri: string;
  title: string;
  subtitle?: string;
  audioPreview?: { url?: string };
};

type EmbedEntity = {
  type: string;
  name: string;
  title?: string;
  subtitle?: string;
  artists?: { name: string }[];
  coverArt?: { sources?: { url: string }[] };
  visualIdentity?: { image?: { url: string; maxWidth?: number }[] };
  audioPreview?: { url?: string };
  trackList?: EmbedTrack[];
};

async function fetchSpotifyEmbedEntity(type: string, id: string): Promise<EmbedEntity> {
  const res = await fetch(`https://open.spotify.com/embed/${type}/${id}`, {
    headers: { "user-agent": UA, "accept-language": "en" },
    cache: "no-store",
  });
  if (!res.ok) throw new ImportError("Spotify didn't respond — check the link and try again.");
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new ImportError("Couldn't read that Spotify page. Is the playlist public?");
  let entity: EmbedEntity | undefined;
  try {
    entity = JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity;
  } catch {
    /* handled below */
  }
  if (!entity?.name) throw new ImportError("Couldn't read that Spotify page. Is the playlist public?");
  return entity;
}

function embedArtwork(entity: EmbedEntity): string | null {
  const vi = entity.visualIdentity?.image;
  if (vi?.length) {
    const sorted = [...vi].sort((a, b) => (b.maxWidth ?? 0) - (a.maxWidth ?? 0));
    const medium = sorted.find((s) => (s.maxWidth ?? 0) <= 640) ?? sorted[sorted.length - 1];
    return medium?.url ?? null;
  }
  return entity.coverArt?.sources?.[0]?.url ?? null;
}

const trackIdFromUri = (uri: string) => uri.split(":").pop() ?? "";

async function fetchTrackThumbnails(trackIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const queue = [...trackIds];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const id = queue.shift()!;
      try {
        const res = await fetch(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${id}`)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const j = (await res.json()) as { thumbnail_url?: string };
          if (j.thumbnail_url) out.set(id, j.thumbnail_url);
        }
      } catch {
        /* leave artwork empty for this track */
      }
    }
  });
  await Promise.all(workers);
  return out;
}

async function importSpotifyEmbed(type: string, id: string, target: ItemKind): Promise<ImportResult> {
  const entity = await fetchSpotifyEmbedEntity(type, id);

  if (target === "album") {
    return {
      items: [
        {
          kind: "album",
          title: entity.name,
          artist: entity.subtitle || entity.artists?.map((a) => a.name).join(", ") || null,
          artworkUrl: embedArtwork(entity),
          sourceUrl: `https://open.spotify.com/album/${id}`,
          source: "spotify",
        },
      ],
      collection: entity.name,
    };
  }

  if (type === "track") {
    return {
      items: [
        {
          kind: "song",
          title: entity.name,
          artist: entity.artists?.map((a) => a.name).join(", ") || entity.subtitle || null,
          artworkUrl: embedArtwork(entity),
          previewUrl: entity.audioPreview?.url ?? null,
          sourceUrl: `https://open.spotify.com/track/${id}`,
          source: "spotify",
        },
      ],
      collection: entity.name,
    };
  }

  // playlist → songs
  const tracks = (entity.trackList ?? []).slice(0, 200);
  if (!tracks.length) throw new ImportError("That playlist looks empty (or it's private).");
  const thumbs = await fetchTrackThumbnails(tracks.map((t) => trackIdFromUri(t.uri)));
  const fallbackArt = embedArtwork(entity);
  return {
    items: tracks.map((t) => {
      const trackId = trackIdFromUri(t.uri);
      return {
        kind: "song" as const,
        title: t.title,
        artist: t.subtitle ?? null,
        artworkUrl: thumbs.get(trackId) ?? fallbackArt,
        previewUrl: t.audioPreview?.url ?? null,
        sourceUrl: `https://open.spotify.com/track/${trackId}`,
        source: "spotify",
      };
    }),
    collection: entity.name,
  };
}

/* Official Web API — used automatically when SPOTIFY_CLIENT_ID/SECRET are set. */

let spotifyToken: { value: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken && spotifyToken.expires > Date.now()) return spotifyToken.value;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization:
        "Basic " +
        Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("spotify token failed");
  const j = (await res.json()) as { access_token: string; expires_in: number };
  spotifyToken = { value: j.access_token, expires: Date.now() + (j.expires_in - 60) * 1000 };
  return spotifyToken.value;
}

async function spotifyApi<T>(path: string): Promise<T> {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`spotify api ${res.status}`);
  return res.json() as Promise<T>;
}

type ApiTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: { name: string; images?: { url: string; width: number }[] };
  preview_url?: string | null;
  external_urls?: { spotify?: string };
};

const apiArt = (images?: { url: string; width: number }[]) =>
  images?.slice().sort((a, b) => a.width - b.width).find((i) => i.width >= 300)?.url ??
  images?.[0]?.url ??
  null;

function apiTrackToItem(t: ApiTrack): NewItem {
  return {
    kind: "song",
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album?.name ?? null,
    artworkUrl: apiArt(t.album?.images),
    previewUrl: t.preview_url ?? null,
    sourceUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
    source: "spotify",
  };
}

async function importSpotifyApi(type: string, id: string, target: ItemKind): Promise<ImportResult> {
  if (target === "album") {
    const a = await spotifyApi<{
      name: string;
      artists: { name: string }[];
      images: { url: string; width: number }[];
      external_urls?: { spotify?: string };
    }>(`/albums/${id}`);
    return {
      items: [
        {
          kind: "album",
          title: a.name,
          artist: a.artists.map((x) => x.name).join(", "),
          artworkUrl: apiArt(a.images),
          sourceUrl: a.external_urls?.spotify ?? `https://open.spotify.com/album/${id}`,
          source: "spotify",
        },
      ],
      collection: a.name,
    };
  }
  if (type === "track") {
    const t = await spotifyApi<ApiTrack>(`/tracks/${id}`);
    return { items: [apiTrackToItem(t)], collection: t.name };
  }
  const first = await spotifyApi<{
    name: string;
    tracks: { items: { track: ApiTrack | null }[]; next: string | null };
  }>(`/playlists/${id}?fields=name,tracks.items(track(id,name,artists(name),album(name,images),preview_url,external_urls)),tracks.next`);
  const tracks: ApiTrack[] = first.tracks.items.map((i) => i.track).filter((t): t is ApiTrack => !!t);
  let next = first.tracks.next;
  let offset = 100;
  while (next && tracks.length < 400) {
    const page = await spotifyApi<{ items: { track: ApiTrack | null }[]; next: string | null }>(
      `/playlists/${id}/tracks?limit=100&offset=${offset}`
    );
    tracks.push(...page.items.map((i) => i.track).filter((t): t is ApiTrack => !!t));
    next = page.next;
    offset += 100;
  }
  return { items: tracks.map(apiTrackToItem), collection: first.name };
}

/* ---------------------------- Apple Music ---------------------------- */

type ItunesResult = {
  wrapperType: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  collectionId?: number;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
};

async function itunesLookup(ids: string[], storefront: string): Promise<ItunesResult[]> {
  const results: ItunesResult[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150).join(",");
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${chunk}&country=${encodeURIComponent(storefront)}`,
      { cache: "no-store" }
    );
    if (!res.ok) continue;
    const j = (await res.json()) as { results?: ItunesResult[] };
    results.push(...(j.results ?? []));
  }
  return results;
}

const itunesArt = (url?: string) => (url ? url.replace("100x100bb", "600x600bb") : null);

async function importApple(
  type: string,
  id: string,
  storefront: string,
  songId: string | undefined,
  target: ItemKind
): Promise<ImportResult> {
  // album link with ?i=… is really a single song
  const effectiveType = type === "album" && songId ? "song" : type;

  if (target === "song" && effectiveType === "album") throw wrongSection("an album", "My Albums");
  if (target === "album" && effectiveType !== "album")
    throw new ImportError("The My Albums section takes album links. For playlists and songs, use My Songs.");

  if (effectiveType === "album") {
    const results = await itunesLookup([id], storefront);
    const col = results.find((r) => r.wrapperType === "collection");
    if (!col) throw new ImportError("Couldn't find that album on Apple Music — check the link.");
    return {
      items: [
        {
          kind: "album",
          title: col.collectionName ?? "Unknown album",
          artist: col.artistName ?? null,
          artworkUrl: itunesArt(col.artworkUrl100),
          sourceUrl: col.collectionViewUrl ?? null,
          source: "apple",
        },
      ],
      collection: col.collectionName,
    };
  }

  if (effectiveType === "song") {
    const lookupId = songId ?? id;
    const results = await itunesLookup([lookupId], storefront);
    const song = results.find((r) => r.kind === "song") ?? results[0];
    if (!song?.trackName) throw new ImportError("Couldn't find that song on Apple Music — check the link.");
    return {
      items: [
        {
          kind: "song",
          title: song.trackName,
          artist: song.artistName ?? null,
          album: song.collectionName ?? null,
          artworkUrl: itunesArt(song.artworkUrl100),
          previewUrl: song.previewUrl ?? null,
          sourceUrl: song.trackViewUrl ?? null,
          source: "apple",
        },
      ],
      collection: song.trackName,
    };
  }

  // playlist
  return importApplePlaylist(id, storefront);
}

type ApplePageTrack = {
  id?: string;
  title?: string;
  artwork?: { dictionary?: { url?: string } };
  subtitleLinks?: { title?: string }[];
  tertiaryLinks?: { title?: string }[];
  contentDescriptor?: { kind?: string; identifiers?: { storeAdamID?: string | number }; url?: string };
};

function findAppleTrackItems(node: unknown, depth = 0): ApplePageTrack[] {
  if (depth > 10 || !node || typeof node !== "object") return [];
  if (Array.isArray(node)) {
    if (
      node.length > 0 &&
      node.every(
        (x) => x && typeof x === "object" && (x as ApplePageTrack).contentDescriptor?.kind === "song"
      )
    ) {
      return node as ApplePageTrack[];
    }
    for (const child of node) {
      const found = findAppleTrackItems(child, depth + 1);
      if (found.length) return found;
    }
    return [];
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findAppleTrackItems(value, depth + 1);
    if (found.length) return found;
  }
  return [];
}

async function importApplePlaylist(id: string, storefront: string): Promise<ImportResult> {
  const res = await fetch(`https://music.apple.com/${storefront}/playlist/x/${id}`, {
    headers: { "user-agent": UA, "accept-language": "en-US" },
    cache: "no-store",
  });
  if (!res.ok) throw new ImportError("Apple Music didn't respond — check the link and try again.");
  const html = await res.text();
  const m = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new ImportError("Couldn't read that playlist. Is it public? (Profile playlists must be shared.)");

  let tracks: ApplePageTrack[] = [];
  try {
    tracks = findAppleTrackItems(JSON.parse(m[1]));
  } catch {
    /* handled below */
  }
  if (!tracks.length) throw new ImportError("Couldn't find any songs in that playlist — is it public?");

  const title = html
    .match(/<title>([^<]*)<\/title>/)?.[1]
    ?.replace(/ - playlist.*$|Apple\s*Music.*$/i, "")
    .replace(/[‎‏⁠﻿]/g, "")
    .trim();

  const adamIds = tracks
    .map((t) => String(t.contentDescriptor?.identifiers?.storeAdamID ?? ""))
    .filter((x) => /^\d+$/.test(x));
  const lookup = new Map<string, ItunesResult>();
  try {
    for (const r of await itunesLookup(adamIds, storefront)) {
      if (r.trackId) lookup.set(String(r.trackId), r);
    }
  } catch {
    /* enrichment is best-effort */
  }

  const items: NewItem[] = tracks.map((t) => {
    const adamId = String(t.contentDescriptor?.identifiers?.storeAdamID ?? "");
    const extra = lookup.get(adamId);
    const artTemplate = t.artwork?.dictionary?.url;
    return {
      kind: "song",
      title: extra?.trackName ?? t.title ?? "Unknown song",
      artist: extra?.artistName ?? t.subtitleLinks?.map((l) => l.title).filter(Boolean).join(", ") ?? null,
      album: extra?.collectionName ?? t.tertiaryLinks?.[0]?.title ?? null,
      artworkUrl: artTemplate
        ? artTemplate.replace("{w}x{h}bb.{f}", "600x600bb.jpg")
        : itunesArt(extra?.artworkUrl100),
      previewUrl: extra?.previewUrl ?? null,
      sourceUrl: extra?.trackViewUrl ?? t.contentDescriptor?.url ?? null,
      source: "apple",
    };
  });

  return { items, collection: title || undefined };
}
