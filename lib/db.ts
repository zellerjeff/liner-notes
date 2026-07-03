import { createClient, type Client, type InArgs } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type User = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  slug: string;
  page_title: string | null;
  intro: string | null;
  is_public: number;
  created_at: string;
};

export type ItemKind = "song" | "album";

export type Item = {
  id: number;
  user_id: number;
  kind: ItemKind;
  title: string;
  artist: string | null;
  album: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  source_url: string | null;
  source: string | null;
  note: string;
  position: number;
  created_at: string;
};

declare global {
  var __linerNotesDb: Client | undefined;
  var __linerNotesSchema: Promise<void> | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  slug TEXT UNIQUE NOT NULL,
  page_title TEXT,
  intro TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('song', 'album')),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  artwork_url TEXT,
  preview_url TEXT,
  source_url TEXT,
  source TEXT,
  note TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_dedupe ON items(user_id, kind, source_url);
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id, kind, position);
`;

function getClient(): Client {
  if (globalThis.__linerNotesDb) return globalThis.__linerNotesDb;
  const url = process.env.TURSO_DATABASE_URL || "file:data/linernotes.db";
  if (url.startsWith("file:")) {
    fs.mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
  }
  globalThis.__linerNotesDb = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return globalThis.__linerNotesDb;
}

/** Client with the schema applied (once per process). */
async function db(): Promise<Client> {
  const client = getClient();
  globalThis.__linerNotesSchema ??= client
    .batch(
      SCHEMA.split(";").map((s) => s.trim()).filter(Boolean),
      "write"
    )
    .then(() => undefined);
  await globalThis.__linerNotesSchema;
  return client;
}

// libsql Row objects expose columns via getters, which React refuses to pass
// from Server to Client Components — copy them into plain objects.
async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  const res = await (await db()).execute({ sql, args });
  return res.rows[0] ? ({ ...res.rows[0] } as T) : undefined;
}

async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const res = await (await db()).execute({ sql, args });
  return res.rows.map((r) => ({ ...r }) as T);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

async function generateSlug(name: string | null | undefined): Promise<string> {
  const base = slugify(name || "listener") || "listener";
  for (let i = 0; i < 20; i++) {
    const candidate = `${base}-${crypto.randomBytes(2).toString("hex")}`;
    const exists = await one("SELECT 1 as x FROM users WHERE slug = ?", [candidate]);
    if (!exists) return candidate;
  }
  return `${base}-${crypto.randomBytes(6).toString("hex")}`;
}

export async function upsertUser(
  email: string,
  name?: string | null,
  image?: string | null
): Promise<User> {
  const existing = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (existing) {
    const updated = await one<User>(
      "UPDATE users SET name = COALESCE(?, name), image = COALESCE(?, image) WHERE id = ? RETURNING *",
      [name ?? null, image ?? null, existing.id]
    );
    return updated ?? existing;
  }
  const slug = await generateSlug(name);
  const created = await one<User>(
    "INSERT INTO users (email, name, image, slug) VALUES (?, ?, ?, ?) RETURNING *",
    [email, name ?? null, image ?? null, slug]
  );
  return created!;
}

export async function getUserById(id: number): Promise<User | undefined> {
  return one<User>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function getUserBySlug(slug: string): Promise<User | undefined> {
  return one<User>("SELECT * FROM users WHERE slug = ?", [slug]);
}

export async function updateProfile(
  userId: number,
  fields: { page_title?: string; intro?: string; slug?: string; is_public?: boolean }
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  if (fields.slug !== undefined) {
    const slug = fields.slug.toLowerCase().trim();
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
      return { ok: false, error: "Link name must be 3–40 characters: lowercase letters, numbers, and dashes." };
    }
    const taken = await one("SELECT id FROM users WHERE slug = ? AND id != ?", [slug, userId]);
    if (taken) return { ok: false, error: "That link name is already taken — try another." };
    await one("UPDATE users SET slug = ? WHERE id = ?", [slug, userId]);
  }
  if (fields.page_title !== undefined) {
    await one("UPDATE users SET page_title = ? WHERE id = ?", [fields.page_title.slice(0, 120), userId]);
  }
  if (fields.intro !== undefined) {
    await one("UPDATE users SET intro = ? WHERE id = ?", [fields.intro.slice(0, 2000), userId]);
  }
  if (fields.is_public !== undefined) {
    await one("UPDATE users SET is_public = ? WHERE id = ?", [fields.is_public ? 1 : 0, userId]);
  }
  const user = await getUserById(userId);
  return { ok: true, user: user! };
}

export async function listItems(userId: number): Promise<Item[]> {
  return all<Item>("SELECT * FROM items WHERE user_id = ? ORDER BY kind, position, id", [userId]);
}

export type NewItem = {
  kind: ItemKind;
  title: string;
  artist?: string | null;
  album?: string | null;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  sourceUrl?: string | null;
  source?: string | null;
};

export async function insertItems(
  userId: number,
  items: NewItem[]
): Promise<{ added: number; skipped: number }> {
  const client = await db();
  const maxRows = await all<{ kind: ItemKind; maxPos: number }>(
    "SELECT kind, MAX(position) as maxPos FROM items WHERE user_id = ? GROUP BY kind",
    [userId]
  );
  const nextPos: Record<ItemKind, number> = { song: 1, album: 1 };
  for (const row of maxRows) nextPos[row.kind] = Number(row.maxPos) + 1;

  // Positions may end up with gaps when duplicates are ignored; ordering only
  // depends on relative values, so that's fine.
  const statements = items.map((it) => ({
    sql: `INSERT OR IGNORE INTO items (user_id, kind, title, artist, album, artwork_url, preview_url, source_url, source, position)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      it.kind,
      it.title,
      it.artist ?? null,
      it.album ?? null,
      it.artworkUrl ?? null,
      it.previewUrl ?? null,
      it.sourceUrl ?? null,
      it.source ?? null,
      nextPos[it.kind]++,
    ] as InArgs,
  }));
  const results = await client.batch(statements, "write");
  const added = results.reduce((sum, r) => sum + r.rowsAffected, 0);
  return { added, skipped: items.length - added };
}

export async function updateNote(userId: number, itemId: number, note: string): Promise<boolean> {
  const res = await (await db()).execute({
    sql: "UPDATE items SET note = ? WHERE id = ? AND user_id = ?",
    args: [note.slice(0, 5000), itemId, userId],
  });
  return res.rowsAffected > 0;
}

export async function deleteItem(userId: number, itemId: number): Promise<boolean> {
  const res = await (await db()).execute({
    sql: "DELETE FROM items WHERE id = ? AND user_id = ?",
    args: [itemId, userId],
  });
  return res.rowsAffected > 0;
}

export async function moveItem(
  userId: number,
  itemId: number,
  direction: "up" | "down"
): Promise<boolean> {
  const item = await one<Item>("SELECT * FROM items WHERE id = ? AND user_id = ?", [itemId, userId]);
  if (!item) return false;
  const neighbor = await one<Item>(
    direction === "up"
      ? "SELECT * FROM items WHERE user_id = ? AND kind = ? AND position < ? ORDER BY position DESC LIMIT 1"
      : "SELECT * FROM items WHERE user_id = ? AND kind = ? AND position > ? ORDER BY position ASC LIMIT 1",
    [userId, item.kind, item.position]
  );
  if (!neighbor) return false;
  await (await db()).batch(
    [
      { sql: "UPDATE items SET position = ? WHERE id = ?", args: [neighbor.position, item.id] },
      { sql: "UPDATE items SET position = ? WHERE id = ?", args: [item.position, neighbor.id] },
    ],
    "write"
  );
  return true;
}
