"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import PlayButton from "@/components/PlayButton";

type Item = {
  id: number;
  kind: "song" | "album";
  title: string;
  artist: string | null;
  album: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  source_url: string | null;
  source: string | null;
  note: string;
  position: number;
};

type Profile = {
  name: string | null;
  image: string | null;
  slug: string;
  page_title: string | null;
  intro: string | null;
  is_public: boolean;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong.");
  return data as T;
}

function SourceBadge({ source }: { source: string | null }) {
  if (source === "spotify")
    return <span className="text-[10px] font-bold uppercase tracking-wider bg-mint text-teal-deep px-2 py-0.5 rounded-full">Spotify</span>;
  if (source === "apple")
    return <span className="text-[10px] font-bold uppercase tracking-wider bg-blush text-coral-deep px-2 py-0.5 rounded-full">Apple Music</span>;
  return null;
}

function Artwork({ item, size = "w-16 h-16" }: { item: Item; size?: string }) {
  if (item.artwork_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.artwork_url} alt="" className={`${size} rounded-xl object-cover shrink-0 bg-lilac`} />;
  }
  return (
    <div className={`${size} rounded-xl shrink-0 bg-gradient-to-br from-violet to-coral flex items-center justify-center text-white text-xl font-extrabold`}>
      ♪
    </div>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  onMove,
  onDelete,
}: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: number, dir: "up" | "down") => void;
  onDelete: (id: number) => void;
}) {
  const [note, setNote] = useState(item.note);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(item.note);

  const save = useCallback(
    (value: string) => {
      if (value === latest.current) return;
      setStatus("saving");
      api(`/api/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ note: value }) })
        .then(() => {
          latest.current = value;
          setStatus("saved");
          setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
        })
        .catch(() => setStatus("error"));
    },
    [item.id]
  );

  function handleNoteChange(value: string) {
    setNote(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), 900);
  }

  return (
    <li className="bg-paper rounded-2xl border border-ink/5 shadow-lift p-4 sm:p-5">
      <div className="flex gap-4">
        <Artwork item={item} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">{item.title}</p>
              <p className="text-sm text-ink-soft truncate">
                {item.artist}
                {item.kind === "song" && item.album ? <span className="text-ink-faint"> · {item.album}</span> : null}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <SourceBadge source={item.source} />
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-ink-faint hover:text-ink underline underline-offset-2"
                  >
                    Open ↗
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.preview_url && <PlayButton url={item.preview_url} accent="bg-violet" />}
              <button
                type="button"
                disabled={isFirst}
                onClick={() => onMove(item.id, "up")}
                title="Move up"
                className="w-8 h-8 rounded-full bg-cream hover:bg-butter text-ink-soft font-bold disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => onMove(item.id, "down")}
                title="Move down"
                className="w-8 h-8 rounded-full bg-cream hover:bg-butter text-ink-soft font-bold disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                ↓
              </button>
              {confirming ? (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  onMouseLeave={() => setConfirming(false)}
                  className="h-8 px-3 rounded-full bg-coral text-white text-xs font-bold cursor-pointer"
                >
                  Sure?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  title="Remove"
                  className="w-8 h-8 rounded-full bg-cream hover:bg-blush hover:text-coral-deep text-ink-soft font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 relative">
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          onBlur={() => {
            if (timer.current) clearTimeout(timer.current);
            save(note);
          }}
          placeholder={
            item.kind === "song"
              ? "Why this song? The memory, the person, the moment…"
              : "Why this album? Where were you when it had you on repeat?"
          }
          rows={2}
          className="w-full resize-y rounded-xl border-2 border-ink/10 bg-cream/60 px-4 py-3 text-[15px] font-note italic leading-relaxed outline-none focus:border-sunshine placeholder:text-ink-faint placeholder:not-italic placeholder:font-display"
        />
        <span className="absolute right-3 -bottom-1.5 text-[11px] font-bold">
          {status === "saving" && <span className="text-ink-faint">Saving…</span>}
          {status === "saved" && <span className="text-teal-deep">Saved ✓</span>}
          {status === "error" && <span className="text-coral-deep">Couldn&apos;t save — try again</span>}
        </span>
      </div>
    </li>
  );
}

function ImportBox({
  kind,
  onImported,
}: {
  kind: "song" | "album";
  onImported: (items: Item[], message: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ added: number; skipped: number; collection: string | null; items: Item[] }>(
        "/api/import",
        { method: "POST", body: JSON.stringify({ url, kind }) }
      );
      const noun = kind === "song" ? (res.added === 1 ? "song" : "songs") : res.added === 1 ? "album" : "albums";
      let msg = `Added ${res.added} ${noun}`;
      if (res.collection && kind === "song") msg += ` from “${res.collection}”`;
      if (res.skipped > 0) msg += ` (${res.skipped} already on your list)`;
      onImported(res.items, msg);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            kind === "song"
              ? "Paste a Spotify or Apple Music playlist (or song) link…"
              : "Paste a Spotify or Apple Music album link…"
          }
          className="flex-1 rounded-full border-2 border-ink/10 bg-paper px-5 py-3 font-semibold outline-none focus:border-teal placeholder:text-ink-faint placeholder:font-medium"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="bg-ink text-cream font-bold px-6 py-3 rounded-full hover:bg-coral transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default shrink-0"
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </form>
      {busy && (
        <p className="mt-2 text-sm text-ink-faint pl-2">
          Fetching titles, artists, and artwork — big playlists can take a few seconds…
        </p>
      )}
      {error && <p className="mt-2 text-sm font-semibold text-coral-deep pl-2">{error}</p>}
    </div>
  );
}

function useToast(): [string | null, (msg: string) => void] {
  const [toast, setToast] = useState<string | null>(null);
  const show = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);
  return [toast, show];
}

export default function Editor({
  initialUser,
  initialItems,
}: {
  initialUser: Profile;
  initialItems: Item[];
}) {
  const [profile, setProfile] = useState(initialUser);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [toast, showToast] = useToast();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Empty on the server, the real origin after hydration.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );

  const songs = useMemo(() => items.filter((i) => i.kind === "song"), [items]);
  const albums = useMemo(() => items.filter((i) => i.kind === "album"), [items]);
  const shareUrl = `${origin}/w/${profile.slug}`;

  function saveProfile(fields: Partial<Profile> & { slug?: string }) {
    setProfileError(null);
    api<{ user: { slug: string; page_title: string | null; intro: string | null; is_public: number } }>(
      "/api/profile",
      { method: "PATCH", body: JSON.stringify(fields) }
    )
      .then((res) =>
        setProfile((p) => ({
          ...p,
          slug: res.user.slug,
          page_title: res.user.page_title,
          intro: res.user.intro,
          is_public: res.user.is_public === 1,
        }))
      )
      .catch((e) => setProfileError(e instanceof Error ? e.message : "Couldn't save."));
  }

  function handleMove(id: number, dir: "up" | "down") {
    api<{ items: Item[] }>(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify({ move: dir }) })
      .then((res) => setItems(res.items))
      .catch(() => showToast("Couldn't reorder — try again."));
  }

  function handleDelete(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    api(`/api/items/${id}`, { method: "DELETE" }).catch(() => showToast("Couldn't remove that one — refresh and try again."));
  }

  function copyShare() {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const defaultTitle = profile.name ? `${profile.name.split(" ")[0]}'s Liner Notes` : "My Liner Notes";

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Logo size={30} />
          <div className="flex items-center gap-2.5">
            <Link
              href={`/w/${profile.slug}`}
              target="_blank"
              className="hidden sm:block text-sm font-bold text-ink-soft hover:text-ink px-3 py-2"
            >
              Preview ↗
            </Link>
            <button
              type="button"
              onClick={copyShare}
              className="text-sm font-bold bg-sunshine text-ink px-4 py-2 rounded-full hover:bg-sunshine-deep transition-colors cursor-pointer"
            >
              {copied ? "Copied! ✓" : "Copy share link"}
            </button>
            <button
              type="button"
              onClick={() => void signOut({ redirectTo: "/" })}
              className="text-sm font-bold text-ink-soft hover:text-coral-deep px-2 py-2 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-14">
        {/* Page settings */}
        <section className="bg-paper rounded-3xl border border-ink/5 shadow-lift p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="font-display font-extrabold tracking-tight text-2xl">
              Your page<span className="text-coral">.</span>
            </h1>
            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={profile.is_public}
                onChange={(e) => saveProfile({ is_public: e.target.checked })}
                className="w-4 h-4 accent-teal"
              />
              {profile.is_public ? "Public — anyone with the link can view" : "Private — only you can see it"}
            </label>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="page-title">
                Page title
              </label>
              <input
                id="page-title"
                defaultValue={profile.page_title ?? ""}
                placeholder={defaultTitle}
                onBlur={(e) => {
                  if (e.target.value !== (profile.page_title ?? "")) saveProfile({ page_title: e.target.value });
                }}
                className="w-full rounded-xl border-2 border-ink/10 bg-cream/60 px-4 py-2.5 font-semibold outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="page-slug">
                Share link
              </label>
              <div className="flex items-center rounded-xl border-2 border-ink/10 bg-cream/60 focus-within:border-teal overflow-hidden">
                <span className="pl-4 pr-1 text-sm text-ink-faint font-semibold whitespace-nowrap">
                  {origin ? origin.replace(/^https?:\/\//, "") : ""}/w/
                </span>
                <input
                  id="page-slug"
                  defaultValue={profile.slug}
                  onBlur={(e) => {
                    if (e.target.value !== profile.slug) saveProfile({ slug: e.target.value });
                  }}
                  className="flex-1 min-w-0 bg-transparent py-2.5 pr-4 font-semibold outline-none"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold mb-1.5" htmlFor="page-intro">
                Introduction
              </label>
              <textarea
                id="page-intro"
                defaultValue={profile.intro ?? ""}
                placeholder="A few words to the people reading this. Who is it for? What do these songs mean to you as a whole?"
                rows={3}
                onBlur={(e) => {
                  if (e.target.value !== (profile.intro ?? "")) saveProfile({ intro: e.target.value });
                }}
                className="w-full resize-y rounded-xl border-2 border-ink/10 bg-cream/60 px-4 py-3 font-note italic text-[15px] leading-relaxed outline-none focus:border-teal placeholder:not-italic placeholder:font-display placeholder:text-ink-faint"
              />
            </div>
          </div>
          {profileError && <p className="mt-3 text-sm font-semibold text-coral-deep">{profileError}</p>}
        </section>

        {/* Songs */}
        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-display font-extrabold tracking-tight text-3xl">
              My Songs<span className="text-sunshine">.</span>
            </h2>
            <span className="text-sm font-bold text-ink-faint">{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
          </div>
          <p className="mt-1.5 text-ink-soft">
            Paste a playlist and we&apos;ll bring in every track — or add songs one link at a time.
          </p>
          <div className="mt-5">
            <ImportBox kind="song" onImported={(list, msg) => { setItems(list); showToast(msg); }} />
          </div>
          {songs.length === 0 ? (
            <div className="mt-6 border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center text-ink-faint font-semibold">
              No songs yet. In Spotify or Apple Music, hit Share → Copy Link on a playlist, then paste it above.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {songs.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isFirst={i === 0}
                  isLast={i === songs.length - 1}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Albums */}
        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-display font-extrabold tracking-tight text-3xl">
              My Albums<span className="text-teal">.</span>
            </h2>
            <span className="text-sm font-bold text-ink-faint">{albums.length} {albums.length === 1 ? "album" : "albums"}</span>
          </div>
          <p className="mt-1.5 text-ink-soft">
            The records that deserve to be heard front to back. One album link at a time.
          </p>
          <div className="mt-5">
            <ImportBox kind="album" onImported={(list, msg) => { setItems(list); showToast(msg); }} />
          </div>
          {albums.length === 0 ? (
            <div className="mt-6 border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center text-ink-faint font-semibold">
              No albums yet. Share → Copy Link on an album page, then paste it above.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {albums.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isFirst={i === 0}
                  isLast={i === albums.length - 1}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Share footer */}
        <section className="bg-ink text-cream rounded-3xl p-8 sm:p-10 text-center">
          <h2 className="font-display font-extrabold tracking-tight text-2xl">Ready to pass it on?</h2>
          <p className="mt-2 text-cream/60 max-w-lg mx-auto">
            Anyone with your link can read your liner notes and play the previews — no account needed.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <code className="bg-cream/10 px-4 py-2.5 rounded-full text-sm font-semibold break-all">{shareUrl}</code>
            <button
              type="button"
              onClick={copyShare}
              className="bg-sunshine text-ink font-bold px-5 py-2.5 rounded-full hover:bg-sunshine-deep transition-colors cursor-pointer"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-ink text-cream font-bold px-5 py-3 rounded-full shadow-lift">
          {toast}
        </div>
      )}
    </div>
  );
}
