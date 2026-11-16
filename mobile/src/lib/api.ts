import type { Item, ItemKind, User } from '@/lib/types';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://liner-notes-theta.vercel.app'
).replace(/\/+$/, '');

// The bearer token for the signed-in user. Phase 3 persists it in SecureStore;
// until then, EXPO_PUBLIC_DEV_TOKEN (dev builds only) lets the app run signed in.
let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken(): string | null {
  if (token) return token;
  if (__DEV__ && process.env.EXPO_PUBLIC_DEV_TOKEN) return process.env.EXPO_PUBLIC_DEV_TOKEN;
  return null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const api = {
  /** Exchange a Google/Apple ID token for a long-lived API token. */
  signIn: (provider: 'google' | 'apple', idToken: string, name?: string) =>
    request<{ token: string; user: User }>('/api/mobile/auth', {
      method: 'POST',
      body: JSON.stringify({ provider, idToken, name }),
    }),

  listItems: () => request<{ items: Item[] }>('/api/items'),

  importLink: (url: string, kind: ItemKind) =>
    request<{ added: number; skipped: number; collection: string | null; items: Item[] }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ url, kind }) }
    ),

  updateNote: (itemId: number, note: string) =>
    request<{ ok: true }>(`/api/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),

  deleteItem: (itemId: number) =>
    request<{ ok: true }>(`/api/items/${itemId}`, { method: 'DELETE' }),

  reorder: (kind: ItemKind, ids: number[]) =>
    request<{ ok: true }>('/api/reorder', {
      method: 'POST',
      body: JSON.stringify({ kind, ids }),
    }),

  updateProfile: (fields: {
    page_title?: string;
    intro?: string;
    slug?: string;
    is_public?: boolean;
  }) =>
    request<{ user: User }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),

  deleteAccount: () => request<{ ok: true }>('/api/profile', { method: 'DELETE' }),
};
