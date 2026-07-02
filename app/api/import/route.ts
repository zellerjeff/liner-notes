import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { insertItems, listItems } from "@/lib/db";
import { importLink, ImportError } from "@/lib/importers";

// Large playlist imports fan out ~100 artwork requests; give the function headroom.
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { url?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const kind = body.kind === "album" ? "album" : "song";

  try {
    const result = await importLink(body.url ?? "", kind);
    const { added, skipped } = await insertItems(user.id, result.items);
    return NextResponse.json({
      added,
      skipped,
      collection: result.collection ?? null,
      items: await listItems(user.id),
    });
  } catch (err) {
    if (err instanceof ImportError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("import failed:", err);
    return NextResponse.json(
      { error: "Something went wrong importing that link. Try again in a moment." },
      { status: 500 }
    );
  }
}
