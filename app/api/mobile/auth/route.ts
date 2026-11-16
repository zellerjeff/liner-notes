import { NextResponse } from "next/server";
import { demoEnabled } from "@/auth";
import { upsertUser } from "@/lib/db";
import { mintMobileToken, verifyAppleIdToken, verifyGoogleIdToken } from "@/lib/mobileAuth";

// POST { provider: "google" | "apple" | "demo", idToken?: string, name?: string }
// → { token, user } — the token goes in `Authorization: Bearer` on every API call.
// "demo" mirrors the site's name-only demo login and obeys the same gate.
export async function POST(req: Request) {
  let body: { provider?: string; idToken?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (body.provider === "demo") {
    if (!demoEnabled) {
      return NextResponse.json({ error: "Demo login is disabled." }, { status: 403 });
    }
    const name = String(body.name || "").trim().slice(0, 60) || "Demo Listener";
    const handle =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "demo";
    const user = await upsertUser(`${handle}@demo.linernotes.local`, name, null);
    const token = await mintMobileToken(user.id);
    return NextResponse.json({ token, user });
  }

  const provider = body.provider;
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if ((provider !== "google" && provider !== "apple") || !idToken) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  let identity;
  try {
    identity =
      provider === "google" ? await verifyGoogleIdToken(idToken) : await verifyAppleIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Sign-in could not be verified." }, { status: 401 });
  }

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 60)
      : identity.name;
  const user = await upsertUser(identity.email, name, identity.image);
  const token = await mintMobileToken(user.id);
  return NextResponse.json({ token, user });
}
