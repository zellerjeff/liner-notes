import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { reorderItems } from "@/lib/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { kind?: string; ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const kind = body.kind === "album" ? "album" : "song";
  if (!Array.isArray(body.ids) || !body.ids.every((x) => Number.isInteger(x))) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const ok = await reorderItems(user.id, kind, body.ids as number[]);
  if (!ok) {
    return NextResponse.json(
      { error: "That order looks out of date — refresh and try again." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
