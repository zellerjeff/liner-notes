// Mirrors the server types in liner-notes/lib/db.ts.

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

export type ItemKind = 'song' | 'album';

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
