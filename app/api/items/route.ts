import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { listItems } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ items: await listItems(user.id) });
}
