import { useCallback, useSyncExternalStore } from 'react';

import { api, ApiError, getToken } from '@/lib/api';
import type { Item, ItemKind } from '@/lib/types';

// One shared items store: both tabs (and, on tablets, both panes) read the same
// snapshot, and a refresh or edit anywhere updates everywhere.

type Snapshot = {
  items: Item[] | null;
  error: string | null;
  refreshing: boolean;
};

let snapshot: Snapshot = { items: null, error: null, refreshing: false };
const subscribers = new Set<() => void>();

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  subscribers.forEach((fn) => fn());
}

/** Replace the item list (e.g. with the list an import or reorder returned). */
export function publishItems(items: Item[]) {
  set({ items });
}

export async function refreshItems(opts: { spinner?: boolean } = {}) {
  if (opts.spinner) set({ refreshing: true });
  try {
    const { items } = await api.listItems();
    set({ items, error: null, refreshing: false });
  } catch (err) {
    set({
      error: err instanceof ApiError ? err.message : 'Could not load your list.',
      refreshing: false,
    });
  }
}

let fetchStarted = false;

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

/** Clear the store on sign-out / sign-in so the list refetches for the new session. */
export function resetItems() {
  fetchStarted = false;
  set({ items: null, error: null, refreshing: false });
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

export function useItems(kind: ItemKind) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const refresh = useCallback((opts?: { spinner?: boolean }) => refreshItems(opts), []);

  return {
    items: snap.items?.filter((i) => i.kind === kind) ?? null,
    allItems: snap.items,
    error: snap.error,
    refreshing: snap.refreshing,
    refresh,
  };
}
