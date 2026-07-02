import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { updateNote, deleteItem, moveItem, listItems } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const itemId = Number(id);

  let body: { note?: string; move?: "up" | "down" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (typeof body.note === "string") {
    const ok = await updateNote(user.id, itemId, body.note);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body.move === "up" || body.move === "down") {
    await moveItem(user.id, itemId, body.move);
    return NextResponse.json({ ok: true, items: await listItems(user.id) });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteItem(user.id, Number(id));
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
