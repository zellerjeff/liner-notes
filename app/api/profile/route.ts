import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { updateProfile } from "@/lib/db";

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { page_title?: string; intro?: string; slug?: string; is_public?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const result = await updateProfile(user.id, {
    page_title: typeof body.page_title === "string" ? body.page_title : undefined,
    intro: typeof body.intro === "string" ? body.intro : undefined,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    is_public: typeof body.is_public === "boolean" ? body.is_public : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ user: result.user });
}
