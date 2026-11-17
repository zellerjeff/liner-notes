import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, getToken } from '@/lib/api';
import type { Item, ItemKind } from '@/lib/types';

// One shared items store: both tabs (and, on tablets, both panes) read the same
// snapshot, and a refresh or edit anywhere updates everywhere.
//
// Offline behavior: the last list is cached on disk and shown instantly on
// launch; notes the server hasn't accepted are queued on disk and re-sent on
// the next successful refresh.

const CACHE_KEY = 'linernotes.items';
const PENDING_KEY = 'linernotes.pendingNotes';

type Snapshot = {
  items: Item[] | null;
  error: string | null;
  refreshing: boolean;
  /** The last refresh failed at the network level; `items` may be stale. */
  offline: boolean;
};

let snapshot: Snapshot = { items: null, error: null, refreshing: false, offline: false };
const subscribers = new Set<() => void>();
let pendingNotes: Record<string, string> = {};
let hydrated: Promise<void> | null = null;
let fetchStarted = false;

function set(next: Partial<Snapshot>, opts: { persist?: boolean } = {}) {
  snapshot = { ...snapshot, ...next };
  if ('items' in next && opts.persist !== false) {
    const write =
      snapshot.items === null
        ? AsyncStorage.removeItem(CACHE_KEY)
        : AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot.items));
    write.catch(() => {});
  }
  subscribers.forEach((fn) => fn());
}

function persistPending() {
  AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pendingNotes)).catch(() => {});
}

function withPending(items: Item[]): Item[] {
  return items.map((i) => {
    const queued = pendingNotes[String(i.id)];
    return queued !== undefined ? { ...i, note: queued } : i;
  });
}

/** Load the cached list and queued notes from disk, once per launch. */
function hydrate(): Promise<void> {
  hydrated ??= (async () => {
    try {
      const [rawItems, rawPending] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(PENDING_KEY),
      ]);
      if (rawPending) pendingNotes = JSON.parse(rawPending) as Record<string, string>;
      if (rawItems && snapshot.items === null) {
        set({ items: withPending(JSON.parse(rawItems) as Item[]) }, { persist: false });
      }
    } catch {
      // unreadable cache: start empty and let the network fill it
    }
  })();
  return hydrated;
}

async function flushPendingNotes() {
  for (const [id, note] of Object.entries(pendingNotes)) {
    try {
      await api.updateNote(Number(id), note);
      delete pendingNotes[id];
    } catch (err) {
      // The item is gone or the note is unacceptable: stop retrying it.
      // Anything else (offline, server trouble): keep the queue for later.
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
        delete pendingNotes[id];
      } else {
        break;
      }
    }
  }
  persistPending();
}

/** Replace the item list (e.g. with the list an import or reorder returned). */
export function publishItems(items: Item[]) {
  set({ items: withPending(items) });
}

export async function refreshItems(opts: { spinner?: boolean } = {}) {
  if (opts.spinner) set({ refreshing: true });
  await hydrate();
  try {
    await flushPendingNotes();
    const { items } = await api.listItems();
    set({ items: withPending(items), error: null, refreshing: false, offline: false });
  } catch (err) {
    const fromServer = err instanceof ApiError;
    set({
      error: fromServer ? err.message : 'Could not reach Liner Notes.',
      refreshing: false,
      offline: !fromServer,
    });
  }
}

/** Optimistically patch one item (e.g. its note) in place. */
export function patchItem(itemId: number, patch: Partial<Item>) {
  if (!snapshot.items) return;
  set({ items: snapshot.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
}

/** Optimistically drop one item. */
export function removeItem(itemId: number) {
  if (!snapshot.items) return;
  set({ items: snapshot.items.filter((i) => i.id !== itemId) });
}

/** The server accepted this note: reflect it everywhere and drop any queued copy. */
export function noteSaved(itemId: number, note: string) {
  if (pendingNotes[String(itemId)] !== undefined) {
    delete pendingNotes[String(itemId)];
    persistPending();
  }
  patchItem(itemId, { note });
}

/** The server couldn't be reached: keep the note on disk and re-send it later. */
export function queueNote(itemId: number, note: string) {
  pendingNotes[String(itemId)] = note;
  persistPending();
  patchItem(itemId, { note });
}

/** Clear the store on sign-out / sign-in so the list refetches for the new session. */
export function resetItems() {
  fetchStarted = false;
  pendingNotes = {};
  AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
  set({ items: null, error: null, refreshing: false, offline: false });
  if (subscribers.size > 0 && getToken()) {
    fetchStarted = true;
    refreshItems();
  }
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  if (!fetchStarted && getToken()) {
    fetchStarted = true;
    refreshItems();
  }
  return () => {
    subscribers.delete(fn);
  };
}

function getSnapshot() {
  return snapshot;
}

// Coming back to the app is the natural moment to pick up changes made on the
// website and to retry anything queued while offline.
AppState.addEventListener('change', (state) => {
  if (state === 'active' && fetchStarted && getToken()) refreshItems();
});

export function useItems(kind: ItemKind) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const refresh = useCallback((opts?: { spinner?: boolean }) => refreshItems(opts), []);

  return {
    items: snap.items?.filter((i) => i.kind === kind) ?? null,
    allItems: snap.items,
    error: snap.error,
    offline: snap.offline,
    refreshing: snap.refreshing,
    refresh,
  };
}
